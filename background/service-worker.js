// Background Service Worker - Handles Grok API Communication

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeTweet') {
    handleAnalyzeTweet(request.content)
      .then(analysis => {
        sendResponse({ success: true, analysis });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'checkApiKey') {
    checkApiKeyStatus()
      .then(status => {
        sendResponse({ success: true, status });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
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
async function handleAnalyzeTweet(tweetContent) {
  // Get API key from storage
  // const result = await chrome.storage.sync.get('grokApiKey');
  const apiKey = 'xai-kW3shB0I1iT3scNNUiPwowKZVskFEYzp1eCrLUSkhunD9BQ3P1y85XnAXC6BuJOmBaRMchlTcHZ6ID8h';
  // result.grokApiKey;

  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  // Check if content is valid
  if (!tweetContent || tweetContent.trim().length === 0) {
    throw new Error('Please write something first!');
  }

  // Call Grok API
  const analysis = await callGrokAPI(apiKey, tweetContent);

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

// Call Grok API
async function callGrokAPI(apiKey, tweetContent) {
  const prompt = generateAnalysisPrompt(tweetContent);

  try {
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4',
        input: [
          {
            role: 'system',
            content: 'You are an expert at analyzing tweet virality based on X\'s open-source recommendation algorithm. You understand engagement patterns, content quality, and what makes tweets go viral. Provide detailed, actionable analysis in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Grok API key in settings.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 402) {
        throw new Error('Insufficient credits. Please add credits to your Grok account.');
      } else {
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();

    // Handle both Responses API and Chat Completions API formats
    let analysisText;
    if (data.output && Array.isArray(data.output) && data.output[0]) {
      // Responses API format: output[0].content[0].text
      const firstOutput = data.output[0];
      if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content[0]) {
        analysisText = firstOutput.content[0].text;
      } else {
        console.error('Unexpected output structure:', firstOutput);
        throw new Error('Unexpected response format from Grok API');
      }
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      // Chat Completions API format (fallback)
      analysisText = data.choices[0].message.content;
    } else {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Grok API');
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse Grok response:', analysisText);
      throw new Error('Invalid response format from Grok API');
    }

    return analysis;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}

// Generate analysis prompt for Grok
function generateAnalysisPrompt(content) {
  return `You are an expert Twitter growth advisor. Analyze this tweet and provide ACTIONABLE, SPECIFIC feedback to improve engagement.

Tweet: "${content}"

IMPORTANT INSTRUCTIONS:
- Be direct and honest about what's lacking
- Focus on HIGH-IMPACT changes the user can make RIGHT NOW
- Don't rewrite the entire tweet - keep the core message intact
- Suggest SPECIFIC edits (add this emoji, use this hashtag, rephrase this part)
- Prioritize changes by impact (what will move the needle most)
- Make suggestions feel like a conversation, not a lecture

X's algorithm favors:
✅ 100-250 characters (sweet spot for engagement)
✅ 1-2 relevant hashtags (not more)
✅ Questions that drive replies
✅ Emotional triggers (curiosity, inspiration, controversy)
✅ Clear value (teach, entertain, inspire)
✅ Visual indicators (emojis, line breaks)
✅ Authentic voice (not corporate/bland)

Provide analysis in this exact JSON format:
{
  "overallScore": <number 0-100>,
  "rating": "<Viral Potential|Strong Performance|Good|Needs Improvement|Low Engagement>",
  "metrics": {
    "lengthScore": <0-100>,
    "hashtagScore": <0-100>,
    "mentionScore": <0-100>,
    "linkScore": <0-100>,
    "mediaIndicatorScore": <0-100>,
    "questionScore": <0-100>,
    "engagementScore": <0-100>,
    "structureScore": <0-100>,
    "readabilityScore": <0-100>,
    "contentQualityScore": <0-100>,
    "toneScore": <0-100>
  },
  "engagementPrediction": {
    "likes": "<high|medium|low>",
    "replies": "<high|medium|low>",
    "retweets": "<high|medium|low>",
    "reasoning": "<1 sentence explaining why>"
  },
  "tone": "<inspirational|educational|controversial|humorous|neutral|other>",
  "strengths": [
    "<specific thing done well - max 2 items>"
  ],
  "suggestions": [
    {
      "issue": "<What's missing or weak>",
      "suggestion": "<SPECIFIC edit to make. Example: 'Add: What's your favorite tip? at the end' or 'Replace X with Y' or 'Add 🔥 emoji before the key point'>",
      "impact": "<high|medium|low>"
    }
  ],
  "rewriteExample": "<Apply your TOP 3 suggestions to the original tweet. Keep the core message and style, just enhance it with your suggestions. Don't completely rewrite - iterate on what's there. IMPORTANT: Do NOT add hashtags to the rewrite unless the original tweet already had them. Only suggest hashtags in the suggestions section, not in the actual rewrite.>",
  "risks": [
    "<1-2 specific risks IF ANY, otherwise empty array>"
  ]
}

CRITICAL: Make suggestions ULTRA-SPECIFIC. Not "add emotion" but "Add 🚀 before your main point" or "End with: What do you think?" or "Change 'good' to 'game-changing'". The user should know EXACTLY what to type.`;
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

// Check if API key is configured
async function checkApiKeyStatus() {
  const result = await chrome.storage.sync.get('grokApiKey');
  return {
    configured: !!result.grokApiKey,
    hasKey: !!result.grokApiKey
  };
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
