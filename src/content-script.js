// Identify ChatGPT and Claude input areas
const SELECTORS = [
  'textarea',
  '[contenteditable="true"]',
  '.ProseMirror',
  '[role="textbox"]'
];

function extractText(element) {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.value;
  }
  return element.innerText || element.textContent;
}

function showEcoBadge(route, co2SavedGrams, inputElement) {
  // Remove existing badge if any
  const existing = document.getElementById('eco-llm-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'eco-llm-badge';
  badge.style.position = 'absolute';
  badge.style.bottom = '100%';
  badge.style.right = '0';
  badge.style.marginBottom = '10px';
  badge.style.padding = '8px 12px';
  badge.style.borderRadius = '8px';
  badge.style.fontSize = '12px';
  badge.style.fontFamily = 'system-ui, sans-serif';
  badge.style.zIndex = '9999';
  badge.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  badge.style.transition = 'all 0.3s ease';

  if (route === 'local') {
    badge.style.backgroundColor = '#d1fae5';
    badge.style.color = '#065f46';
    badge.style.border = '1px solid #10b981';
    badge.innerHTML = `🌿 <b>Eco-LLM:</b> Routed locally. Saved ${co2SavedGrams.toFixed(4)}g CO2`;
  } else {
    badge.style.backgroundColor = '#f3f4f6';
    badge.style.color = '#374151';
    badge.style.border = '1px solid #d1d5db';
    badge.innerHTML = `☁️ <b>Eco-LLM:</b> Sent to cloud`;
  }

  // Find a good relative parent
  const parent = inputElement.closest('form') || inputElement.parentElement;
  if (parent) {
    parent.style.position = 'relative';
    parent.appendChild(badge);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (badge.parentNode) badge.remove();
  }, 5000);
}

function showLocalResponse(responseHtml, inputElement) {
  const container = document.createElement('div');
  container.className = 'eco-llm-local-response';
  container.style.padding = '12px 16px';
  container.style.margin = '16px 0';
  container.style.backgroundColor = '#f0fdf4';
  container.style.border = '1px solid #86efac';
  container.style.borderRadius = '8px';
  container.style.color = '#166534';
  container.style.fontFamily = 'system-ui, sans-serif';
  container.innerHTML = `<strong>🌿 Eco-LLM Local Response:</strong><br/>${responseHtml}`;

  const chatContainer = document.querySelector('main') || document.body;
  
  // Try to insert before the input form
  const form = inputElement.closest('form');
  if (form && form.parentNode) {
    form.parentNode.insertBefore(container, form);
  } else {
    chatContainer.appendChild(container);
  }
}

async function handleIntercept(prompt, event, inputElement) {
  if (!prompt || prompt.trim() === '') return;

  // Temporarily disable submission while processing?
  // Could be complex, just prevent default first
  event.preventDefault();
  event.stopPropagation();
  
  // Show processing state
  const originalCursor = inputElement.style.cursor;
  inputElement.style.cursor = 'wait';
  inputElement.disabled = true;

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: "PROMPT_SUBMITTED",
        prompt: prompt,
        url: window.location.href,
        timestamp: Date.now()
      }, resolve);
    });

    inputElement.style.cursor = originalCursor;
    inputElement.disabled = false;

    if (response && response.route === 'local') {
      showEcoBadge('local', response.co2SavedGrams, inputElement);
      showLocalResponse(response.localResponse, inputElement);
      // We don't resubmit, we intercepted it successfully
      
      // Clear input
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = '';
      } else {
        inputElement.innerText = '';
      }
    } else {
      showEcoBadge('cloud', 0, inputElement);
      
      // It's a cloud route, we need to allow the submission to continue.
      // Since we prevented default, we can try to re-dispatch the event without our interceptor,
      // or simply manually trigger the form submit if it's a form.
      // For React apps like ChatGPT/Claude, simply dispatching a simulated Enter keydown or Form submit
      // bypassing our listener is tricky.
      
      // A safe fallback: Temporarily remove our listener and trigger submit/Enter
      removeListeners();
      
      if (event.type === 'submit') {
        event.target.submit();
      } else if (event.type === 'keydown') {
        // Dispatch an enter key again
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
        });
        inputElement.dispatchEvent(enterEvent);
      }
      
      // Re-attach listeners after a short delay
      setTimeout(attachListeners, 500);
    }
  } catch (error) {
    console.error("[Eco-LLM Proxy] Error communicating with background:", error);
    // On error, let it pass through
    inputElement.style.cursor = originalCursor;
    inputElement.disabled = false;
    removeListeners();
    if (event.type === 'submit') event.target.submit();
    setTimeout(attachListeners, 500);
  }
}

function submitListener(event) {
  const target = event.target;
  let inputElement = null;
  
  if (target.tagName === 'FORM') {
    for (const selector of SELECTORS) {
      inputElement = target.querySelector(selector);
      if (inputElement) break;
    }
  }

  if (inputElement) {
    const prompt = extractText(inputElement);
    if (prompt.trim().length > 0) {
      handleIntercept(prompt, event, inputElement);
    }
  }
}

function keydownListener(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    const target = event.target;
    const isInput = SELECTORS.some(selector => target.matches(selector));
    
    if (isInput) {
      const prompt = extractText(target);
      if (prompt.trim().length > 0) {
        handleIntercept(prompt, event, target);
      }
    }
  }
}

function attachListeners() {
  document.addEventListener('submit', submitListener, true);
  document.addEventListener('keydown', keydownListener, true);
}

function removeListeners() {
  document.removeEventListener('submit', submitListener, true);
  document.removeEventListener('keydown', keydownListener, true);
}

// Initial attachment
attachListeners();
console.log("[Eco-LLM Proxy] Content script loaded and listening.");
