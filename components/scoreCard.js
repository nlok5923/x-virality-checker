// Score Card Component

function createScoreCard(analysis) {
  const score = analysis.overallScore;
  const rating = analysis.rating;
  const tone = analysis.tone;

  // Determine color based on score
  let gradientClass = '';
  let emoji = '';

  if (score >= 85) {
    gradientClass = 'score-excellent';
    emoji = '🔥';
  } else if (score >= 70) {
    gradientClass = 'score-good';
    emoji = '⭐';
  } else if (score >= 55) {
    gradientClass = 'score-average';
    emoji = '👍';
  } else if (score >= 40) {
    gradientClass = 'score-needs-work';
    emoji = '📈';
  } else {
    gradientClass = 'score-poor';
    emoji = '⚠️';
  }

  const html = `
    <div class="virality-score-card ${gradientClass}">
      <div class="score-card-content">
        <div class="score-emoji">${emoji}</div>
        <div class="score-number">${score}</div>
        <div class="score-rating">${rating}</div>
        <div class="score-tone">Tone: ${capitalizeFirst(tone)}</div>
      </div>
    </div>
  `;

  return html;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
