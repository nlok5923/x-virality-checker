// Metrics Breakdown Component

function createMetricsBreakdown(metrics) {
  const metricLabels = {
    lengthScore: 'Length Optimization',
    hashtagScore: 'Hashtag Strategy',
    mentionScore: 'Mentions & Tags',
    linkScore: 'Link Strategy',
    mediaIndicatorScore: 'Media Potential',
    questionScore: 'Engagement Triggers',
    engagementScore: 'Engagement Language',
    structureScore: 'Content Structure',
    readabilityScore: 'Readability',
    contentQualityScore: 'Content Quality',
    toneScore: 'Tone & Voice'
  };

  let html = '<div class="virality-metrics-section">';
  html += '<h3 class="metrics-title">📊 Score Breakdown</h3>';
  html += '<div class="metrics-list">';

  for (const [key, value] of Object.entries(metrics)) {
    const label = metricLabels[key] || key;
    const scoreClass = getScoreClass(value);

    html += `
      <div class="metric-row">
        <span class="metric-name">${label}</span>
        <div class="metric-value-container">
          <div class="metric-bar-container">
            <div class="metric-bar ${scoreClass}" style="width: ${value}%"></div>
          </div>
          <span class="metric-score">${value}/100</span>
        </div>
      </div>
    `;
  }

  html += '</div>';
  html += '</div>';

  return html;
}

function createEngagementPrediction(prediction) {
  if (!prediction) return '';

  const getEngagementColor = (level) => {
    if (level === 'high') return 'engagement-high';
    if (level === 'medium') return 'engagement-medium';
    return 'engagement-low';
  };

  const getEngagementIcon = (level) => {
    if (level === 'high') return '🔥';
    if (level === 'medium') return '👍';
    return '📊';
  };

  const html = `
    <div class="virality-engagement-section">
      <h3 class="section-title">🎯 Predicted Engagement</h3>
      <div class="engagement-grid">
        <div class="engagement-item ${getEngagementColor(prediction.likes)}">
          <span class="engagement-icon">${getEngagementIcon(prediction.likes)}</span>
          <span class="engagement-label">Likes</span>
          <span class="engagement-level">${capitalizeFirst(prediction.likes)}</span>
        </div>
        <div class="engagement-item ${getEngagementColor(prediction.replies)}">
          <span class="engagement-icon">${getEngagementIcon(prediction.replies)}</span>
          <span class="engagement-label">Replies</span>
          <span class="engagement-level">${capitalizeFirst(prediction.replies)}</span>
        </div>
        <div class="engagement-item ${getEngagementColor(prediction.retweets)}">
          <span class="engagement-icon">${getEngagementIcon(prediction.retweets)}</span>
          <span class="engagement-label">Retweets</span>
          <span class="engagement-level">${capitalizeFirst(prediction.retweets)}</span>
        </div>
      </div>
      ${prediction.reasoning ? `<p class="engagement-reasoning">${prediction.reasoning}</p>` : ''}
    </div>
  `;

  return html;
}

function getScoreClass(score) {
  if (score >= 85) return 'score-excellent';
  if (score >= 70) return 'score-good';
  if (score >= 55) return 'score-average';
  if (score >= 40) return 'score-needs-work';
  return 'score-poor';
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
