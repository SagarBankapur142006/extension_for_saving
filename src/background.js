import { classifyPrompt, estimateTokenCount } from './classifier.js';
import { calculateSavings } from './co2-calculator.js';
import { getGridIntensity } from './electricity-maps-api.js';
import { updateStats, getSettings } from './storage.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROMPT_SUBMITTED") {
    handlePromptSubmission(message.prompt)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error("[Eco-LLM Proxy] Background processing error:", error);
        // Fallback to cloud if anything fails
        sendResponse({ route: "cloud", reason: "Error occurred", tokenCount: 0, co2SavedGrams: 0 });
      });
    return true; // Keep the message channel open for async response
  }
});

async function handlePromptSubmission(prompt) {
  const tokenCount = estimateTokenCount(prompt);
  const classification = await classifyPrompt(prompt);
  
  const settings = await getSettings();
  const gridIntensity = await getGridIntensity(settings.regionCode);

  let route = "cloud";
  let co2SavedGrams = 0;
  let localResponse = null;

  if (classification.label === "simple") {
    route = "local";
    co2SavedGrams = calculateSavings({ tokenCount, gridIntensity });
    
    // Simulate a local response since DistilBERT (sentiment) doesn't generate conversational text
    localResponse = `Eco-LLM (Local): Processed locally. Task detected: ${classification.taskType || 'Simple query'}. Saved ~${co2SavedGrams.toFixed(4)}g CO2.`;
  }

  const decision = {
    route,
    reason: classification.reason,
    tokenCount,
    classificationScore: classification.score,
    gridIntensity,
    co2SavedGrams,
    taskType: classification.taskType
  };

  await updateStats(decision);

  return {
    ...decision,
    localResponse
  };
}
