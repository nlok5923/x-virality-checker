// Metrics Breakdown Component

function createMetricsBreakdown(metrics) {
  const metricLabels = {
    lengthScore: 'Length Optimization',
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

  const formatNumber = (num) => {
    if (typeof num === 'string') num = parseInt(num);
    if (isNaN(num)) return '~';

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Add context about predictions
  let contextNote;
  if (prediction.followerCount && prediction.followerCount > 0) {
    contextNote = `📊 Based on your ~${formatNumber(prediction.followerCount)} followers and content quality`;
  } else {
    contextNote = '📊 Based on estimated audience size and content quality (follower count not detected)';
  }

  const html = `
    <div class="virality-engagement-section">
      <h3 class="section-title">🎯 Predicted Performance</h3>
      <p class="prediction-context">${contextNote}</p>
      <div class="engagement-grid-numbers">
        <div class="engagement-stat">
          <div class="stat-icon">👁️</div>
          <div class="stat-value">${formatNumber(prediction.views)}</div>
          <div class="stat-label">Views</div>
        </div>
        <div class="engagement-stat">
          <div class="stat-icon">❤️</div>
          <div class="stat-value">${formatNumber(prediction.likes)}</div>
          <div class="stat-label">Likes</div>
        </div>
        <div class="engagement-stat">
          <div class="stat-icon">💬</div>
          <div class="stat-value">${formatNumber(prediction.replies)}</div>
          <div class="stat-label">Replies</div>
        </div>
        <div class="engagement-stat">
          <div class="stat-icon">🔄</div>
          <div class="stat-value">${formatNumber(prediction.retweets)}</div>
          <div class="stat-label">Retweets</div>
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
