// Background Service Worker - Handles Grok API Communication

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeTweet') {
    handleAnalyzeTweet(request.content, request.followerCount, request.userBio)
      .then(analysis => {
        sendResponse({ success: true, analysis });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'checkApiKey') {
    // No longer needed - backend server handles API key
    sendResponse({
      success: true,
      status: { configured: true, hasKey: true }
    });
    return true;
  }

  if (request.action === 'checkRateLimit') {
    checkRateLimitStorage()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ allowed: true });
      });
    return true;
  }

  if (request.action === 'recordAnalysis') {
    recordAnalysisStorage();
    sendResponse({ success: true });
    return true;
  }
});

// Main analysis function
async function handleAnalyzeTweet(tweetContent, followerCount = null, userBio = null) {
  // Check if content is valid
  if (!tweetContent || tweetContent.trim().length === 0) {
    throw new Error('Please write something first!');
  }

  // Call backend server
  const analysis = await callAnalysisAPI(tweetContent, followerCount, userBio);

  // Record usage
  const estimatedCost = calculateCost(500, 800); // Approximate token counts
  await updateUsageStats(estimatedCost);

  // Save to history
  await saveAnalysisToHistory({
    ...analysis,
    originalContent: tweetContent
  });

  return analysis;
}

// Call backend analysis API
async function callAnalysisAPI(tweetContent, followerCount, userBio) {
  // Backend server URL - change this to your deployed server URL in production
  const API_URL = 'http://localhost:3000/api/analyze';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: tweetContent,
        followerCount: followerCount,
        userBio: userBio
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText || 'Server error';

      if (response.status === 503 || errorMessage.includes('ECONNREFUSED')) {
        throw new Error('Backend server is not running. Please start the server first.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success || !data.analysis) {
      throw new Error('Invalid response from analysis server');
    }

    return data.analysis;
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Please ensure the server is running on http://localhost:3000');
    }
    throw error;
  }
}

// Calculate estimated cost
function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000000) * 0.20;
  const outputCost = (outputTokens / 1000000) * 0.50;
  return inputCost + outputCost;
}

// Update usage statistics
async function updateUsageStats(cost) {
  const result = await chrome.storage.local.get('usageStats');
  const stats = result.usageStats || {
    analysisCount: 0,
    totalCost: 0,
    lastResetDate: new Date().toISOString(),
    monthlyAnalyses: []
  };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  stats.analysisCount += 1;
  stats.totalCost += cost;

  // Monthly tracking
  let monthlyEntry = stats.monthlyAnalyses.find(m => m.month === currentMonth);
  if (!monthlyEntry) {
    monthlyEntry = { month: currentMonth, count: 0, cost: 0 };
    stats.monthlyAnalyses.push(monthlyEntry);
  }

  monthlyEntry.count += 1;
  monthlyEntry.cost += cost;

  await chrome.storage.local.set({ usageStats: stats });
}

// Save analysis to history
async function saveAnalysisToHistory(analysis) {
  const settingsResult = await chrome.storage.sync.get('settings');
  const settings = settingsResult.settings || { saveHistory: true };

  if (!settings.saveHistory) return;

  const result = await chrome.storage.local.get('analysisHistory');
  const history = result.analysisHistory || [];

  history.unshift({
    timestamp: new Date().toISOString(),
    content: analysis.originalContent,
    score: analysis.overallScore,
    rating: analysis.rating
  });

  // Keep only last 50
  if (history.length > 50) {
    history.length = 50;
  }

  await chrome.storage.local.set({ analysisHistory: history });
}

// Rate limit constants
const RATE_LIMIT_COOLDOWN_MS = 6000; // 6 seconds

// Check rate limit from storage
async function checkRateLimitStorage() {
  const result = await chrome.storage.local.get('lastAnalysisTime');
  const lastTime = result.lastAnalysisTime || 0;
  const now = Date.now();

  if (now - lastTime < RATE_LIMIT_COOLDOWN_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - lastTime)) / 1000);
    return { allowed: false, waitTime };
  }

  return { allowed: true };
}

// Record analysis timestamp in storage
async function recordAnalysisStorage() {
  await chrome.storage.local.set({ lastAnalysisTime: Date.now() });
}
