// X/Twitter Design System Constants
const X_COLORS = {
  // Brand colors
  primary: '#1D9BF0',
  primaryHover: '#1A8CD8',

  // Backgrounds
  bgLight: '#FFFFFF',
  bgDark: '#000000',
  surfaceLight: '#F7F9F9',
  surfaceDark: '#16181C',

  // Text
  textPrimaryLight: '#0F1419',
  textPrimaryDark: '#E7E9EA',
  textSecondary: '#536471',

  // Borders
  borderLight: '#EFF3F4',
  borderDark: '#2F3336',

  // States
  hoverLight: 'rgba(29, 155, 240, 0.1)',
  hoverDark: 'rgba(29, 155, 240, 0.1)',

  // Status colors
  success: '#00BA7C',
  warning: '#F4B000',
  error: '#F4212E',

  // Gradients
  primaryGradient: 'linear-gradient(135deg, #1D9BF0 0%, #1A8CD8 100%)',

  // Score-based colors
  scoreExcellent: '#00BA7C',
  scoreGood: '#1D9BF0',
  scoreAverage: '#F4B000',
  scorePoor: '#F4212E'
};

// Twitter DOM Selectors (these may change with Twitter updates)
const TWITTER_SELECTORS = {
  // Compose areas
  mainCompose: '[data-testid="tweetTextarea_0"]',
  replyCompose: '[data-testid="tweetTextarea_1"]',
  dmCompose: '[data-testid="dmComposerTextInput"]',

  // Toolbars
  toolbar: '[data-testid="toolBar"]',

  // Buttons in toolbar
  mediaButton: '[data-testid="attachments"]',
  gifButton: '[data-testid="gif"]',
  pollButton: '[data-testid="poll"]',
  emojiButton: '[data-testid="emoji"]',
  scheduleButton: '[data-testid="schedule"]',

  // Tweet button
  tweetButton: '[data-testid="tweetButton"]',

  // Character count
  charCount: '[data-testid="tweetTextarea_0_CharCount"]'
};

// Analysis scoring weights (based on X algorithm)
const SCORING_WEIGHTS = {
  lengthScore: 0.15,
  hashtagScore: 0.10,
  mentionScore: 0.08,
  linkScore: 0.08,
  mediaIndicatorScore: 0.15,
  questionScore: 0.12,
  engagementScore: 0.12,
  structureScore: 0.10,
  readabilityScore: 0.10
};

// Engagement keywords
const ENGAGEMENT_WORDS = [
  'what', 'how', 'why', 'when', 'where',
  'thoughts', 'think', 'agree', 'opinion',
  'take', 'thread', 'share', 'retweet', 'rt',
  'like', 'follow', 'check out', 'read'
];

// Media keywords
const MEDIA_KEYWORDS = [
  'image', 'photo', 'picture', 'video',
  'watch', 'see', 'look', 'view', 'gif'
];

// Rate limiting
const RATE_LIMIT = {
  maxPerMinute: 10,
  cooldownMs: 6000 // 6 seconds between calls
};

// Cost tracking
const COST_CONFIG = {
  inputTokenCost: 0.20 / 1000000, // $0.20 per million
  outputTokenCost: 0.50 / 1000000, // $0.50 per million
  avgInputTokens: 500,
  avgOutputTokens: 800
};
