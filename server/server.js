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
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3001',         // Next.js dev server
      'http://localhost:3000',         // Alternative local dev
      'https://x-virality-checker.vercel.app', // Vercel production (update with actual domain)
      // Add your production domain here
    ];

    // Allow requests with no origin (like mobile apps, curl, or Postman)
    // or from chrome-extension:// origins
    // or from allowed website origins
    if (!origin || origin.startsWith('chrome-extension://') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow all origins
      // In production, you might want to restrict this
      callback(null, true);
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
  console.log('📥 Received analysis request');

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
        model: 'grok-4-1-fast-reasoning',
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
    console.log('✅ Analysis completed successfully');
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ Error in /api/analyze:', error);
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
    ? `\nUser bio: "${userBio}"\nConsider how the tweet aligns with their niche and audience.`
    : '\nUser bio: Not available';

  return `You are an expert Twitter growth advisor. Analyze this tweet and provide ACTIONABLE, SPECIFIC feedback.

Tweet: "${content}"${followerInfo}${bioInfo}

RULES:
- Direct, actionable feedback only
- Suggest specific edits, not complete rewrites
- No hashtags
- Max 1-2 emojis per suggestion
- Prioritize by impact

Algorithm factors: 100-250 chars, questions for replies, emotional triggers, clear value, line breaks, authentic voice.

ENGAGEMENT PREDICTION (CRITICAL - HIERARCHY: Views > Likes > Replies/Retweets):
- Views: 5-20% of followers (conservative)
- Likes: 1-3% of views
- Replies: 5-10% of likes
- Retweets: 15-30% of likes
Scale down for larger accounts (>50K). If no follower count: 500-2000 views baseline.

JSON format:
{
  "overallScore": 0-100,
  "rating": "Viral Potential|Strong Performance|Good|Needs Improvement|Low Engagement",
  "metrics": {
    "lengthScore": 0-100,
    "mentionScore": 0-100,
    "linkScore": 0-100,
    "mediaIndicatorScore": 0-100,
    "questionScore": 0-100,
    "engagementScore": 0-100,
    "structureScore": 0-100,
    "readabilityScore": 0-100,
    "contentQualityScore": 0-100,
    "toneScore": 0-100
  },
  "engagementPrediction": {
    "followerCount": number,
    "views": "number",
    "likes": "number",
    "replies": "number",
    "retweets": "number",
    "reasoning": "1 sentence"
  },
  "tone": "inspirational|educational|controversial|humorous|neutral|other",
  "strengths": ["max 2 items"],
  "suggestions": [{"issue": "string", "suggestion": "SPECIFIC edit", "impact": "high|medium|low"}],
  "rewriteExample": "Apply TOP 3 suggestions. Keep core message. No hashtags. Max 1-2 emojis. Use \\n for line breaks.",
  "risks": ["1-2 risks or empty"]
}

CRITICAL: Make suggestions ULTRA-SPECIFIC. Not "add emotion" but "Add 🚀 before your main point" or "End with: What do you think?" The user should know EXACTLY what to type.`;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ X Virality Checker API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Analyze endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   GROK_API_KEY configured: ${GROK_API_KEY ? 'Yes' : 'No'}`);
});
