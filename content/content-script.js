// Content Script - Injects Evaluate Button into Twitter UI

console.log('X Virality Checker: Content script loaded');

// Track which compose boxes have buttons
const processedComposeBoxes = new WeakSet();

// Initialize the extension
function init() {
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

  // Twitter's toolbar has two main sections:
  // 1. Left side with media buttons (emoji, gif, poll, etc.)
  // 2. Right side with character count and tweet button

  // Find the left section (contains the media buttons)
  const leftSection = toolbar.querySelector('div[role="group"]') || toolbar.firstElementChild;

  if (leftSection) {
    // Append to the end of the left section (after other media buttons)
    leftSection.appendChild(button);
    console.log('X Virality Checker: Button injected successfully');
  } else {
    // Fallback: prepend to toolbar start
    toolbar.prepend(button);
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

  // Get user's follower count and bio
  const followerCount = getUserFollowerCount();
  const userBio = getUserBio();

  // Check if chrome runtime is available
  if (!chrome || !chrome.runtime) {
    showToast('❌ Extension error: Chrome API not available', 'error');
    console.error('Chrome runtime not available');
    return;
  }

  // Show loading modal
  showLoadingModal();

  // Send to background script for analysis
  try {
    chrome.runtime.sendMessage(
      {
        action: 'analyzeTweet',
        content: content,
        followerCount: followerCount,
        userBio: userBio
      },
      (response) => {
        hideLoadingModal();

        if (chrome.runtime.lastError) {
          console.error('X Virality Checker Error:', chrome.runtime.lastError);
          showToast('❌ Extension error. Please reload the page and try again.', 'error');
          return;
        }

        if (!response) {
          showToast('❌ No response from extension. Please reload the extension.', 'error');
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
  } catch (error) {
    hideLoadingModal();
    console.error('Failed to send message:', error);
    showToast('❌ Extension error. Please reload the page.', 'error');
  }
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

// Get user's follower count and bio from the page
function getUserFollowerCount() {
  try {
    // Method 1: Try to get from Twitter's internal state/API data
    // Twitter stores user data in window.__INITIAL_STATE__ or in React fiber
    try {
      // Look for any script tags that might contain user data
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent.includes('followers_count')) {
          const match = script.textContent.match(/"followers_count":(\d+)/);
          if (match) {
            const count = parseInt(match[1]);
            console.log('X Virality Checker: Found follower count in page state:', count);
            return count;
          }
        }
      }
    } catch (e) {
      // Continue to other methods
    }

    // Method 2: Look for data-testid attributes with follower count
    const followerElements = document.querySelectorAll('[data-testid*="follower"]');
    for (const el of followerElements) {
      const text = el.textContent;
      // Look for patterns like "1.2K" or "1,234" followed by "Followers"
      const match = text.match(/([\d,.]+[KMB]?)\s*Followers?/i);
      if (match) {
        const count = parseFollowerCount(match[1]);
        console.log('X Virality Checker: Found follower count via data-testid:', count);
        return count;
      }
    }

    // Method 3: Look in profile page links
    const followersLinks = document.querySelectorAll('a[href*="/followers"]');
    for (const link of followersLinks) {
      const ariaLabel = link.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.includes('Follower')) {
        const match = ariaLabel.match(/([\d,.]+[KMB]?)\s*Followers?/i);
        if (match) {
          const count = parseFollowerCount(match[1]);
          console.log('X Virality Checker: Found follower count in link aria-label:', count);
          return count;
        }
      }

      // Also check span text inside the link
      const spans = link.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent.trim();
        // Match just numbers with K/M/B
        if (/^[\d,.]+[KMB]?$/.test(text)) {
          const nextText = span.nextElementSibling?.textContent || '';
          const prevText = span.previousElementSibling?.textContent || '';
          const parentText = span.parentElement?.textContent || '';

          if (parentText.toLowerCase().includes('follower')) {
            const count = parseFollowerCount(text);
            console.log('X Virality Checker: Found follower count in profile link:', count);
            return count;
          }
        }
      }
    }

    // Method 4: Search all text for follower count patterns
    const allTextElements = document.querySelectorAll('a, span, div');
    for (const el of allTextElements) {
      // Only check elements with short text (avoid large content blocks)
      if (el.textContent.length > 100) continue;

      const text = el.textContent;
      if (text.toLowerCase().includes('follower')) {
        const match = text.match(/([\d,.]+[KMB]?)\s*Followers?/i);
        if (match) {
          const count = parseFollowerCount(match[1]);
          if (count && count > 0 && count < 1000000000) { // Sanity check
            console.log('X Virality Checker: Found follower count (fallback):', count);
            return count;
          }
        }
      }
    }

    console.warn('X Virality Checker: Could not find follower count');
    return null;
  } catch (error) {
    console.error('X Virality Checker: Error getting follower count:', error);
    return null;
  }
}

// Parse follower count string to number
function parseFollowerCount(str) {
  if (!str) return null;

  str = str.replace(/,/g, ''); // Remove commas

  const multipliers = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  };

  const match = str.match(/([\d.]+)([KMB])?/i);
  if (match) {
    const num = parseFloat(match[1]);
    const multiplier = match[2] ? multipliers[match[2].toUpperCase()] : 1;
    return Math.round(num * multiplier);
  }

  return parseInt(str) || null;
}

// Get user's bio from the page
function getUserBio() {
  try {
    // Method 1: Try to get from Twitter's internal state
    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent.includes('description') && script.textContent.includes('screen_name')) {
          const match = script.textContent.match(/"description":"([^"]+)"/);
          if (match && match[1] && match[1].length > 10) {
            const bio = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
            console.log('X Virality Checker: Found bio in page state:', bio.substring(0, 50) + '...');
            return bio;
          }
        }
      }
    } catch (e) {
      // Continue to other methods
    }

    // Method 2: Look in profile header (if on profile page)
    const bioElement = document.querySelector('[data-testid="UserDescription"]');
    if (bioElement) {
      const bio = bioElement.textContent.trim();
      if (bio.length > 0) {
        console.log('X Virality Checker: Found bio in profile:', bio.substring(0, 50) + '...');
        return bio;
      }
    }

    // Method 3: Look in hover card
    const hoverCard = document.querySelector('[data-testid="HoverCard"]');
    if (hoverCard) {
      const bioInCard = hoverCard.querySelector('[data-testid="UserDescription"]');
      if (bioInCard) {
        const bio = bioInCard.textContent.trim();
        if (bio.length > 0) {
          console.log('X Virality Checker: Found bio in hover card:', bio.substring(0, 50) + '...');
          return bio;
        }
      }
    }

    // Method 4: Try meta tags
    const metaBio = document.querySelector('meta[property="og:description"]');
    if (metaBio) {
      const bio = metaBio.getAttribute('content');
      if (bio && bio.length > 10 && !bio.includes('twitter.com') && !bio.toLowerCase().includes('latest tweets')) {
        console.log('X Virality Checker: Found bio in meta tag:', bio.substring(0, 50) + '...');
        return bio;
      }
    }

    console.warn('X Virality Checker: Could not find user bio');
    return null;
  } catch (error) {
    console.error('X Virality Checker: Error getting user bio:', error);
    return null;
  }
}

// Check rate limiting (uses background script for storage)
async function checkRateLimit() {
  try {
    if (!chrome || !chrome.runtime) {
      console.warn('Chrome runtime API not available, skipping rate limit check');
      return { allowed: true };
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'checkRateLimit' },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            console.warn('Rate limit check failed, allowing analysis');
            resolve({ allowed: true });
            return;
          }
          resolve(response);
        }
      );
    });
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true };
  }
}

// Record analysis for rate limiting (uses background script for storage)
function recordAnalysis() {
  try {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'recordAnalysis' });
    }
  } catch (error) {
    console.error('Failed to record analysis:', error);
  }
}

// Handle analysis errors
function handleAnalysisError(error) {
  console.error('Analysis error:', error);

  if (error.includes('Backend server is not running') || error.includes('Cannot connect to backend')) {
    showToast('⚠️ Backend server is not running. Please start it first.', 'warning');
  } else if (error.includes('Rate limit')) {
    showToast('⏳ Rate limit exceeded. Please wait a moment.', 'warning');
  } else if (error.includes('Insufficient credits')) {
    showToast('💳 Insufficient Grok credits. Please add credits to your account.', 'error');
  } else if (error.includes('Network error') || error.includes('fetch')) {
    showToast('🌐 Network error. Please check your connection and ensure the server is running.', 'error');
  } else {
    showToast(`❌ Error: ${error}`, 'error');
  }
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
