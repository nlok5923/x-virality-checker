# X Virality Checker - Backend Server

This is the backend server for the X Virality Checker Chrome Extension. It securely handles Grok API calls without exposing the API key to clients.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Grok API key from https://console.x.ai

3. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### `GET /health`
Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00.000Z",
  "service": "X Virality Checker API"
}
```

### `POST /api/analyze`
Analyzes a tweet and returns virality predictions and suggestions.

**Request Body:**
```json
{
  "content": "Tweet text to analyze",
  "followerCount": 10000,
  "userBio": "User bio text"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "overallScore": 75,
    "rating": "Good",
    "metrics": { ... },
    "engagementPrediction": { ... },
    "suggestions": [ ... ],
    ...
  }
}
```

## Environment Variables

- `GROK_API_KEY` - Your Grok API key (required)
- `PORT` - Server port (optional, defaults to 3000)

## Security Notes

- Never commit the `.env` file to version control
- The API key is kept secure on the server side
- CORS is configured to only accept requests from the Chrome extension
- Input validation prevents malicious payloads

## Deployment

For production deployment, consider:
- Using a process manager like PM2
- Setting up HTTPS
- Implementing rate limiting
- Adding authentication for the API endpoints
- Using a cloud service (Heroku, Railway, Render, etc.)
