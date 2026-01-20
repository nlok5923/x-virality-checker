# X Virality Checker - Chrome Extension

> Analyze tweet virality using Grok AI and X's recommendation algorithm before you post!

A Chrome extension that seamlessly integrates into X/Twitter's interface, allowing you to analyze your tweets for virality potential using Grok AI. Based on X's open-source recommendation algorithm.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)

## ✨ Features

- **🔥 One-Click Analysis** - Evaluate button integrated directly into Twitter's compose box
- **📊 Comprehensive Scoring** - Get a detailed 0-100 virality score
- **💡 Actionable Suggestions** - Receive specific improvements to boost engagement
- **🤖 Grok AI Powered** - Uses Grok's understanding of X/Twitter content
- **🎯 Engagement Predictions** - Predicts likes, replies, and retweets
- **✨ Rewrite Suggestions** - Get AI-generated improved versions of your tweet
- **🎨 Native Design** - Perfectly matches X's design system
- **🌓 Dark Mode** - Full support for X's dark theme
- **📈 Usage Tracking** - Monitor your analysis count and costs
- **🔒 Privacy-Focused** - No tracking, data only sent to Grok API

## 📸 Screenshots

*Coming soon - Extension in action*

## 🚀 Installation

### Prerequisites

1. **Chrome/Edge/Brave Browser** (Chromium-based)
2. **Node.js** (v16 or higher) - For running the backend server
3. **Grok API Key** - Get yours at [console.x.ai](https://console.x.ai)

### Setup Backend Server

1. **Download/Clone this repository**
   ```bash
   git clone [repository-url]
   cd x-virality-extension
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and add your Grok API key:
   ```
   GROK_API_KEY=xai-your_api_key_here
   PORT=3000
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```

   You should see: `✅ X Virality Checker API server running on port 3000`

   Keep this terminal window open while using the extension.

### Install Extension

1. **Create Extension Icons** (or use placeholders)
   - Place icon files in `assets/icons/`:
     - `icon16.png` (16x16px)
     - `icon48.png` (48x48px)
     - `icon128.png` (128x128px)
   - See [Icon Requirements](#-icon-requirements) below

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `x-virality-extension` folder
   - Extension should now appear in your toolbar

3. **You're ready!**
   - No API key configuration needed in the extension
   - The backend server handles all API calls securely

## 📖 Usage

### Basic Usage

1. **Go to X/Twitter** (x.com or twitter.com)

2. **Start composing a tweet**
   - Click the compose button or start a reply
   - Type your tweet content

3. **Click the Evaluate button** ⚡
   - Look for the lightning bolt icon in the toolbar
   - It appears next to the Bold/Italic buttons

4. **Review your analysis**
   - Overall virality score (0-100)
   - Detailed metric breakdown
   - Strengths and weaknesses
   - Specific improvement suggestions
   - Predicted engagement levels
   - AI-generated rewrite example

5. **Apply improvements** (optional)
   - Click "Apply This Rewrite" to use the suggested version
   - Or manually edit based on suggestions

6. **Post your tweet!**

### Understanding Your Score

| Score Range | Rating | Meaning |
|-------------|--------|---------|
| 85-100 | 🔥 Viral Potential | Excellent content with high engagement potential |
| 70-84 | ⭐ Strong Performance | Good content likely to perform well |
| 55-69 | 👍 Good | Decent content with room for improvement |
| 40-54 | 📈 Needs Improvement | Some issues that hurt engagement |
| 0-39 | ⚠️ Low Engagement | Significant improvements needed |

### Scoring Factors

The extension analyzes 11 key factors:

1. **Length Optimization** (15%) - Ideal: 100-250 characters
2. **Hashtag Strategy** (10%) - Ideal: 1-2 hashtags
3. **Mentions & Tags** (8%) - Ideal: 1-3 mentions
4. **Link Strategy** (8%) - Presence and placement
5. **Media Potential** (15%) - Keywords indicating photos/videos
6. **Engagement Triggers** (12%) - Questions, CTAs
7. **Engagement Language** (12%) - Words that drive interaction
8. **Content Structure** (10%) - Emojis, line breaks, formatting
9. **Readability** (10%) - Clear, scannable content
10. **Content Quality** - AI-assessed interest and value
11. **Tone & Voice** - Emotional impact and style

## 💰 Cost Information

### Grok API Pricing (2026)

Using **Grok Beta** model:
- **Input**: $2.00 per million tokens
- **Output**: $10.00 per million tokens

### Per-Analysis Cost

- Average tokens per analysis: ~500 input + ~800 output
- **Cost per analysis**: ~$0.001 to $0.002 (less than 1/5 of a cent)
- **100 analyses**: ~$0.10 to $0.20
- **1,000 analyses**: ~$1.00 to $2.00

Very affordable for individuals and businesses!

### Usage Tracking

- View your usage statistics in the extension popup
- Monthly analysis count and total cost displayed
- Track spending to stay within budget

## ⚙️ Settings

Access settings by clicking the extension icon:

### Server Status
- **Backend Server**: Must be running on `http://localhost:3000`
- **Check server**: Visit `http://localhost:3000/health` to verify

### Preferences
- **Save Analysis History**: Keep record of past analyses (up to 50)
- **Show Warnings**: Alert before posting low-scoring tweets

### Usage Stats
- **Analysis Count**: Total analyses this month
- **Total Cost**: Estimated Grok API costs

### Actions
- **View History**: See your past tweet analyses
- **Clear History**: Delete all saved history

## 🎯 Icon Requirements

The extension needs three icon sizes:

1. **icon16.png** (16x16px)
   - Used in extension management page

2. **icon48.png** (48x48px)
   - Used in extension management page

3. **icon128.png** (128x128px)
   - Used in Chrome Web Store (if publishing)
   - Used during installation

### Icon Design Suggestions

- **Theme**: Lightning bolt (⚡) or analytics chart (📊)
- **Colors**: Twitter blue (#1D9BF0) on white/transparent background
- **Style**: Minimalist, matching X's design language
- **Format**: PNG with transparency

### Temporary Solution

For testing, you can create simple colored squares:
```bash
# Using ImageMagick (if installed)
convert -size 16x16 xc:#1D9BF0 assets/icons/icon16.png
convert -size 48x48 xc:#1D9BF0 assets/icons/icon48.png
convert -size 128x128 xc:#1D9BF0 assets/icons/icon128.png
```

Or use any online icon generator.

## 🔧 Development

### Project Structure

```
x-virality-extension/
├── manifest.json                 # Extension manifest (V3)
├── server/                       # Backend server (NEW)
│   ├── server.js                # Express server for API calls
│   ├── package.json             # Server dependencies
│   ├── .env                     # Environment variables (API key)
│   ├── .env.example             # Example env file
│   └── README.md                # Server documentation
├── background/
│   └── service-worker.js        # Calls backend server
├── content/
│   ├── content-script.js        # Injects UI into Twitter
│   └── content-styles.css       # Styling (X theme)
├── popup/
│   ├── popup.html               # Settings interface
│   ├── popup.js                 # Settings logic
│   └── popup.css                # Settings styles
├── components/
│   ├── scoreCard.js             # Score display component
│   ├── metricsBreakdown.js      # Metrics visualization
│   ├── suggestionsList.js       # Suggestions component
│   └── resultsModal.js          # Main modal component
├── lib/
│   ├── constants.js             # Configuration & constants
│   └── storage.js               # Chrome storage utilities
└── assets/
    └── icons/                   # Extension icons
```

### Technologies

- **Manifest V3** - Latest Chrome extension format
- **Node.js + Express** - Backend server for secure API calls
- **Vanilla JavaScript** - No framework dependencies (extension)
- **CSS3** - Modern styling with X theme matching
- **Grok API** - AI-powered analysis
- **Chrome Storage API** - Settings and history

### Key Features

- **MutationObserver** - Detects Twitter's dynamic content
- **Content Script Injection** - Seamless UI integration
- **Background Service Worker** - Secure API communication
- **Rate Limiting** - Prevents excessive API calls
- **Error Handling** - Graceful failure management
- **Dark Mode Detection** - Automatic theme switching

## 🐛 Troubleshooting

### Server Issues

- **"Backend server is not running"**
  - Ensure the server is started: `cd server && npm start`
  - Check that it's running on port 3000
  - Visit `http://localhost:3000/health` to verify

- **"Cannot connect to backend server"**
  - Verify server is running in terminal
  - Check for port conflicts (kill other processes on port 3000)
  - Check firewall settings

- **"Invalid API key configured on server"**
  - Check `.env` file in `server/` directory
  - Verify `GROK_API_KEY` is set correctly
  - Restart the server after changing `.env`

### Button Not Appearing

1. **Refresh Twitter** - Try reloading the page
2. **Check Extension** - Ensure it's enabled in `chrome://extensions/`
3. **Twitter Update** - X may have changed their DOM structure
   - Check console for errors
   - Selectors may need updating in `lib/constants.js`

### Analysis Fails

- **"Insufficient credits"**
  - Add credits to your Grok account at console.x.ai/billing
  - Server will return this error from Grok API

- **"Rate limit exceeded"**
  - Wait 6 seconds between analyses
  - Both extension and Grok API enforce rate limits

- **"Network error"**
  - Check internet connection
  - Ensure server can reach api.x.ai
  - Check firewall settings

### General Issues

1. **Clear Extension Data**
   - Go to `chrome://extensions/`
   - Click "Remove" then reinstall

2. **Check Console**
   - Right-click page → Inspect → Console
   - Look for errors with "X Virality Checker"

3. **Check Server Logs**
   - Look at the terminal where server is running
   - Server logs all requests and errors

4. **Report Bug**
   - Include browser version
   - Include console errors
   - Include server logs
   - Describe steps to reproduce

## 🔒 Privacy & Security

### What Data is Sent

- **To Backend Server**: Your tweet content, follower count, and bio
- **To Grok API**: Backend server forwards content to Grok for analysis
- **Nowhere else**: No tracking, no analytics, no third-party services

### Data Storage

- **Backend Server**: Grok API key stored in `.env` file (never exposed to client)
- **Chrome Storage**: Settings and analysis history (local only)
- **No Database**: Server doesn't store any of your tweets or data
- **No Telemetry**: We don't track your usage

### Security Architecture

- **API Key Protection**: Key stays on your server, never in the extension code
- **Local Server**: Runs on localhost, not exposed to internet
- **CORS Protection**: Server only accepts requests from the extension
- **Input Validation**: Server validates all requests before processing

### Permissions Explained

- `storage`: Store settings and history locally
- `activeTab`: Read tweet content you're analyzing
- `host_permissions`: Inject UI into X/Twitter, call local backend server

### Open Source

- All code is visible and auditable
- No obfuscation or hidden functionality
- Community contributions welcome

## 📝 License

Apache License 2.0 - See LICENSE file

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- [ ] Better error handling
- [ ] Support for more compose boxes (DMs, etc.)
- [ ] Batch analysis of multiple tweets
- [ ] Historical performance tracking
- [ ] Firefox support
- [ ] Safari support
- [ ] Internationalization (i18n)
- [ ] Automated testing

## 🙏 Acknowledgments

- **X/Twitter** - For open-sourcing their recommendation algorithm
- **xAI** - For providing the Grok API
- **Grok-1** - Transformer architecture from xAI's open source release

## 📧 Support

- **Issues**: [GitHub Issues](repository-url/issues)
- **Discussions**: [GitHub Discussions](repository-url/discussions)
- **Email**: [your-email]

## 🎉 Changelog

### Version 1.0.0 (2026-01-20)
- Initial release
- Grok API integration
- Real-time tweet analysis
- X theme matching
- Dark mode support
- Usage tracking
- Analysis history

---

**Made with ⚡ by [Your Name]**

*Powered by Grok AI • Based on X's recommendation algorithm*
