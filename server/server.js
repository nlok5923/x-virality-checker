// Standalone Server for X Virality Checker
// This server handles Grok API calls securely without exposing the API key to clients

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Grok API key from environment variable
const GROK_API_KEY = process.env.GROK_API_KEY;

if (!GROK_API_KEY) {
  console.error('ERROR: GROK_API_KEY environment variable is not set!');
  console.error('Please create a .env file with: GROK_API_KEY=your_key_here');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    // or from chrome-extension:// origins
    if (!origin || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for local development
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'X Virality Checker API'
  });
});

// Analyze tweet endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { content, followerCount, userBio } = req.body;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing tweet content'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Tweet content too long'
      });
    }

    // Generate analysis prompt
    const prompt = generateAnalysisPrompt(content, followerCount, userBio);

    // Call Grok API
    const grokResponse = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
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

    if (!grokResponse.ok) {
      const errorData = await grokResponse.json().catch(() => ({}));

      let errorMessage = 'API Error';
      if (grokResponse.status === 401) {
        errorMessage = 'Invalid API key configured on server';
      } else if (grokResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (grokResponse.status === 402) {
        errorMessage = 'Insufficient credits. Please add credits to Grok account.';
      } else {
        errorMessage = errorData.error?.message || grokResponse.statusText;
      }

      return res.status(grokResponse.status).json({
        success: false,
        error: errorMessage
      });
    }

    const data = await grokResponse.json();

    // Parse response
    let analysisText;
    if (data.output && Array.isArray(data.output) && data.output[0]) {
      const firstOutput = data.output[0];
      if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content[0]) {
        analysisText = firstOutput.content[0].text;
      } else {
        throw new Error('Unexpected output structure from Grok API');
      }
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      analysisText = data.choices[0].message.content;
    } else {
      throw new Error('Unexpected response format from Grok API');
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse Grok response:', analysisText);
      throw new Error('Invalid JSON response from Grok API');
    }

    // Return successful analysis
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Generate analysis prompt
function generateAnalysisPrompt(content, followerCount, userBio) {
  const followerInfo = followerCount
    ? `\n\nUser follower count: ${followerCount.toLocaleString()} followers`
    : '\n\nUser follower count: Unknown (not available)';

  const bioInfo = userBio
    ? `\nUser bio: "${userBio}"\nUse this bio to understand the user's niche, expertise, and target audience. Consider how the tweet aligns with their personal brand.`
    : '\nUser bio: Not available';

  return `You are an expert Twitter growth advisor. Analyze this tweet and provide ACTIONABLE, SPECIFIC feedback to improve engagement.

Tweet: "${content}"${followerInfo}${bioInfo}

IMPORTANT INSTRUCTIONS:
- Be direct and honest about what's lacking
- Focus on HIGH-IMPACT changes the user can make RIGHT NOW
- Don't rewrite the entire tweet - keep the core message intact
- Suggest SPECIFIC edits (rephrase this part, add a question, change tone)
- Prioritize changes by impact (what will move the needle most)
- Make suggestions feel like a conversation, not a lecture
- DO NOT suggest adding hashtags - people rarely use them effectively
- Use emojis VERY sparingly - only when they genuinely add value (max 1-2 per tweet)

X's algorithm favors:
✅ 100-250 characters (sweet spot for engagement)
✅ Questions that drive replies
✅ Emotional triggers (curiosity, inspiration, controversy)
✅ Clear value (teach, entertain, inspire)
✅ Line breaks for readability (not walls of text)
✅ Authentic voice (not corporate/bland)
✅ Conversation starters over announcements

ENGAGEMENT PREDICTION GUIDELINES (CRITICAL - FOLLOW EXACTLY):
- ALWAYS return followerCount in the response (use the provided follower count)
- Base predictions on follower count, content quality, and typical X engagement rates
- HIERARCHY VALIDATION: Views > Likes > max(Replies, Retweets) - NO EXCEPTIONS
- Typical engagement rates on X are LOW - be conservative:
  * Views: 5-20% of followers (quality content can reach 50% max)
  * Likes: 1-3% of views for good content
  * Replies: 5-15% of likes (most people don't reply)
  * Retweets: 10-30% of likes

SPECIFIC FORMULAS BY ACCOUNT SIZE:
- Small accounts (<1K followers):
  * Views = followers × 0.1 to 0.3 (100-300 views for 1K followers)
  * Likes = views × 0.02 to 0.04 (2-4% of views)
  * Replies = likes × 0.05 to 0.1 (5-10% of likes)
  * Retweets = likes × 0.15 to 0.25 (15-25% of likes)

- Medium accounts (1K-50K followers):
  * Views = followers × 0.08 to 0.15 (800-1500 views for 10K followers)
  * Likes = views × 0.015 to 0.03 (1.5-3% of views)
  * Replies = likes × 0.05 to 0.1
  * Retweets = likes × 0.15 to 0.25

- Large accounts (>50K followers):
  * Views = followers × 0.05 to 0.12 (5K-12K views for 100K followers)
  * Likes = views × 0.01 to 0.025 (1-2.5% of views)
  * Replies = likes × 0.05 to 0.1
  * Retweets = likes × 0.15 to 0.3

- If follower count unknown: estimate 500-2000 views, apply same percentages

EXAMPLE (10K followers, good content):
✅ CORRECT: Views=1200, Likes=30, Replies=3, Retweets=8
❌ WRONG: Views=35000, Likes=500 (likes can't be 1.4% when views are 350% of followers!)

Provide analysis in this exact JSON format:
{
  "overallScore": <number 0-100>,
  "rating": "<Viral Potential|Strong Performance|Good|Needs Improvement|Low Engagement>",
  "metrics": {
    "lengthScore": <0-100>,
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
    "followerCount": <the follower count you used for predictions, or null if unknown>,
    "views": "<estimated number of views/impressions - MUST be highest>",
    "likes": "<estimated number of likes - must be less than views>",
    "replies": "<estimated number of replies - must be less than likes>",
    "retweets": "<estimated number of retweets - must be less than likes>",
    "reasoning": "<1 sentence explaining the prediction>"
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
  "rewriteExample": "<Apply your TOP 3 suggestions to the original tweet. Keep the core message and style, just enhance it with your suggestions. Don't completely rewrite - iterate on what's there. IMPORTANT: Do NOT add hashtags. Use line breaks (\\n) for better formatting when it improves readability. Keep emojis minimal (max 1-2).>",
  "risks": [
    "<1-2 specific risks IF ANY, otherwise empty array>"
  ]
}

CRITICAL: Make suggestions ULTRA-SPECIFIC. Not "add emotion" but "Add 🚀 before your main point" or "End with: What do you think?" or "Change 'good' to 'game-changing'". The user should know EXACTLY what to type.`;
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ X Virality Checker API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Analyze endpoint: http://localhost:${PORT}/api/analyze`);
});
