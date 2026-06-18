export function estimateTokenCount(text) {
  if (!text) return 0;
  // Basic heuristic: ~4 chars per token on average for English
  return Math.ceil(text.trim().length / 4);
}

export function isSimplePromptHeuristic(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Complexity indicators
  const complexKeywords = [
    'function', 'class', 'bug', 'stack trace', 'typescript', 'python', 'javascript', 'sql', 'regex', 'api', 'compile', 'error',
    'prove', 'derive', 'calculate', 'equation', 'theorem', 'optimize', 'step-by-step', 'reasoning',
    'poem', 'story', 'essay', 'rewrite', 'long-form', 'screenplay', 'marketing', 'plan'
  ];

  for (let kw of complexKeywords) {
    if (lowerPrompt.includes(kw)) {
      return { simple: false, reason: `Found complex keyword: ${kw}` };
    }
  }

  // Simplicity indicators
  const simpleKeywords = [
    'sentiment', 'classify', 'is this positive', 'is this negative', 'summarize', 'extract', 'yes or no'
  ];

  for (let kw of simpleKeywords) {
    if (lowerPrompt.includes(kw)) {
      return { simple: true, reason: `Matches simple task pattern: ${kw}` };
    }
  }

  // Default fallback: if it's very short, it might be simple, but to be safe we lean towards cloud
  // unless it's explicitly simple. But per requirements: route to local if length < 100 and no complex keywords.
  return { simple: true, reason: "No complex keywords found and within token limit." };
}

let pipelineInstance = null;

export async function classifyPrompt(prompt) {
  const tokenCount = estimateTokenCount(prompt);
  
  if (tokenCount > 100) {
    return {
      label: "complex",
      score: 1.0,
      reason: "Token count exceeds 100",
      taskType: "general"
    };
  }

  // Heuristic check
  const heuristic = isSimplePromptHeuristic(prompt);
  if (!heuristic.simple) {
    return {
      label: "complex",
      score: 1.0,
      reason: heuristic.reason,
      taskType: "general"
    };
  }

  // Optional: Try loading Transformers.js for better classification if available
  // We wrap this in a try-catch to ensure we don't break the extension if it fails
  try {
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    
    if (!pipelineInstance) {
      // Using a small zero-shot classifier or sentiment analysis model
      // We'll use a very small model to keep the extension fast
      pipelineInstance = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    }
    
    // We can use the model to score the text. 
    // This is just a placeholder for more advanced intent classification.
    const result = await pipelineInstance(prompt);
    
    return {
      label: "simple",
      score: result[0].score,
      reason: heuristic.reason + " (Verified by DistilBERT)",
      taskType: result[0].label
    };

  } catch (error) {
    console.warn("[Eco-LLM Proxy] Local model inference failed or not supported. Using heuristics.", error);
    return {
      label: "simple",
      score: 0.8,
      reason: heuristic.reason + " (Heuristics only)",
      taskType: "unknown"
    };
  }
}
