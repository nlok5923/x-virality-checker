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
});

// Main analysis function
async function handleAnalyzeTweet(tweetContent) {
  // Get API key from storage
  const result = await chrome.storage.sync.get('grokApiKey');
  const apiKey = result.grokApiKey;

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
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
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
    const analysisText = data.choices[0].message.content;

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
  return `Analyze this tweet for virality potential based on X's recommendation algorithm.

Tweet: "${content}"

X's algorithm predicts engagement using these factors:
1. **Engagement Predictions**: P(like), P(reply), P(retweet), P(quote), P(click), P(share), P(follow_author)
2. **Content Quality**: Interesting, valuable, relevant, clear
3. **Structure**: Hashtags (1-2 optimal), mentions, links, media, questions
4. **Tone**: Inspirational, educational, controversial, humorous, neutral
5. **Readability**: Clear language, proper formatting, emojis, line breaks
6. **Negative Signals**: P(not_interested), P(block), P(mute), P(report)

Provide detailed analysis in this exact JSON format:
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
    "reasoning": "<brief explanation>"
  },
  "tone": "<inspirational|educational|controversial|humorous|neutral|other>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>"
  ],
  "suggestions": [
    {
      "issue": "<what's wrong>",
      "suggestion": "<how to fix it>",
      "impact": "<high|medium|low>"
    }
  ],
  "rewriteExample": "<improved version of the tweet>",
  "risks": [
    "<potential negative signal 1>",
    "<potential negative signal 2>"
  ]
}

Be specific, actionable, and honest. If content is weak, say so clearly.`;
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
