// Content Script - Injects Evaluate Button into Twitter UI

console.log('X Virality Checker: Content script loaded');

// Track which compose boxes have buttons
const processedComposeBoxes = new WeakSet();

// Initialize the extension
function init() {
  // Check if API key is configured
  checkApiKeyStatus();

  // Start observing DOM for compose boxes
  observeTwitterDOM();

  // Try to inject immediately for any existing compose boxes
  injectButtonsIntoExistingComposeBoxes();
}

// Observe Twitter's dynamic DOM
function observeTwitterDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this node or its children contain a compose box
          checkForComposeBoxes(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('X Virality Checker: DOM observer started');
}

// Check for compose boxes in a node
function checkForComposeBoxes(node) {
  // Check if node itself is a toolbar
  if (node.matches && node.matches(TWITTER_SELECTORS.toolbar)) {
    injectButton(node);
    return;
  }

  // Check children for toolbars
  const toolbars = node.querySelectorAll ? node.querySelectorAll(TWITTER_SELECTORS.toolbar) : [];
  toolbars.forEach(toolbar => {
    injectButton(toolbar);
  });
}

// Inject into existing compose boxes
function injectButtonsIntoExistingComposeBoxes() {
  const toolbars = document.querySelectorAll(TWITTER_SELECTORS.toolbar);
  console.log(`X Virality Checker: Found ${toolbars.length} existing toolbars`);

  toolbars.forEach(toolbar => {
    injectButton(toolbar);
  });
}

// Inject evaluate button into toolbar
function injectButton(toolbar) {
  // Check if already processed
  if (processedComposeBoxes.has(toolbar)) {
    return;
  }

  // Check if button already exists
  if (toolbar.querySelector('.virality-evaluate-btn')) {
    return;
  }

  // Mark as processed
  processedComposeBoxes.add(toolbar);

  // Create the button
  const button = createEvaluateButton();

  // Find insertion point (before the compose tweet audience selector)
  // Twitter's toolbar structure varies, so we try multiple approaches
  const insertionPoints = [
    toolbar.querySelector('[data-testid="scheduleOption"]'),
    toolbar.querySelector('[aria-label*="Everyone"]'),
    toolbar.querySelector('[aria-haspopup="menu"]')
  ];

  const insertBefore = insertionPoints.find(el => el !== null);

  if (insertBefore && insertBefore.parentNode) {
    // Insert before the found element
    insertBefore.parentNode.insertBefore(button, insertBefore);
    console.log('X Virality Checker: Button injected successfully');
  } else {
    // Fallback: append to toolbar
    toolbar.appendChild(button);
    console.log('X Virality Checker: Button injected (fallback)');
  }
}

// Create the evaluate button
function createEvaluateButton() {
  const button = document.createElement('div');
  button.className = 'virality-evaluate-btn-wrapper';

  button.innerHTML = `
    <button class="virality-evaluate-btn" title="Analyze virality with Grok AI" aria-label="Analyze virality">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
      </svg>
    </button>
  `;

  const btnElement = button.querySelector('.virality-evaluate-btn');
  btnElement.addEventListener('click', handleEvaluateClick);

  return button;
}

// Handle evaluate button click
async function handleEvaluateClick(e) {
  e.preventDefault();
  e.stopPropagation();

  console.log('X Virality Checker: Evaluate button clicked');

  // Get the tweet content
  const content = getTweetContent();

  if (!content || content.trim().length === 0) {
    showToast('⚠️ Please write something first!', 'warning');
    return;
  }

  // Check rate limiting
  const canAnalyze = await checkRateLimit();
  if (!canAnalyze.allowed) {
    showToast(`⏳ Please wait ${canAnalyze.waitTime} seconds before analyzing again`, 'warning');
    return;
  }

  // Show loading modal
  showLoadingModal();

  // Send to background script for analysis
  chrome.runtime.sendMessage(
    {
      action: 'analyzeTweet',
      content: content
    },
    (response) => {
      hideLoadingModal();

      if (chrome.runtime.lastError) {
        console.error('X Virality Checker Error:', chrome.runtime.lastError);
        showToast('❌ Extension error. Please try again.', 'error');
        return;
      }

      if (response.success) {
        // Show results modal
        showResultsModal(response.analysis, content);

        // Record this analysis for rate limiting
        recordAnalysis();
      } else {
        handleAnalysisError(response.error);
      }
    }
  );
}

// Get tweet content from the active compose box
function getTweetContent() {
  // Try main compose
  const mainCompose = document.querySelector(TWITTER_SELECTORS.mainCompose);
  if (mainCompose && document.activeElement && mainCompose.contains(document.activeElement)) {
    return mainCompose.textContent || '';
  }

  // Try reply compose
  const replyCompose = document.querySelector(TWITTER_SELECTORS.replyCompose);
  if (replyCompose && replyCompose.textContent) {
    return replyCompose.textContent || '';
  }

  // Fallback: get any compose box with content
  if (mainCompose && mainCompose.textContent) {
    return mainCompose.textContent || '';
  }

  return '';
}

// Check rate limiting
async function checkRateLimit() {
  return new Promise((resolve) => {
    chrome.storage.local.get('lastAnalysisTime', (result) => {
      const lastTime = result.lastAnalysisTime || 0;
      const now = Date.now();

      if (now - lastTime < RATE_LIMIT.cooldownMs) {
        const waitTime = Math.ceil((RATE_LIMIT.cooldownMs - (now - lastTime)) / 1000);
        resolve({ allowed: false, waitTime });
      } else {
        resolve({ allowed: true });
      }
    });
  });
}

// Record analysis for rate limiting
function recordAnalysis() {
  chrome.storage.local.set({ lastAnalysisTime: Date.now() });
}

// Handle analysis errors
function handleAnalysisError(error) {
  console.error('Analysis error:', error);

  if (error === 'MISSING_API_KEY') {
    showToast('⚠️ Please configure your Grok API key in the extension settings', 'warning');
    // Open extension popup
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    }, 1500);
  } else if (error.includes('Invalid API key')) {
    showToast('❌ Invalid API key. Please check your settings.', 'error');
  } else if (error.includes('Rate limit')) {
    showToast('⏳ Rate limit exceeded. Please wait a moment.', 'warning');
  } else if (error.includes('Insufficient credits')) {
    showToast('💳 Insufficient Grok credits. Please add credits to your account.', 'error');
  } else if (error.includes('Network error')) {
    showToast('🌐 Network error. Please check your connection.', 'error');
  } else {
    showToast(`❌ Error: ${error}`, 'error');
  }
}

// Check if API key is configured
function checkApiKeyStatus() {
  chrome.runtime.sendMessage({ action: 'checkApiKey' }, (response) => {
    if (response && !response.status.configured) {
      console.log('X Virality Checker: API key not configured');
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Re-initialize when navigating within Twitter (SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('X Virality Checker: Navigation detected, re-initializing');
    setTimeout(injectButtonsIntoExistingComposeBoxes, 1000);
  }
}).observe(document, { subtree: true, childList: true });
