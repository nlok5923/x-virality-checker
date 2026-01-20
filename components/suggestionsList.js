// Suggestions and Strengths Lists Component

function createStrengthsList(strengths) {
  if (!strengths || strengths.length === 0) return '';

  let html = '<div class="virality-strengths-section">';
  html += '<h3 class="section-title">✅ Strengths</h3>';
  html += '<ul class="strengths-list">';

  strengths.forEach(strength => {
    html += `<li class="strength-item">${strength}</li>`;
  });

  html += '</ul>';
  html += '</div>';

  return html;
}

function createSuggestionsList(suggestions) {
  if (!suggestions || suggestions.length === 0) return '';

  // Sort by impact
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  let html = '<div class="virality-suggestions-section">';
  html += '<h3 class="section-title">⚡ Quick Wins - Make These Changes</h3>';
  html += '<div class="suggestions-intro">Here\'s exactly what to edit to boost engagement:</div>';
  html += '<ul class="suggestions-list">';

  sortedSuggestions.forEach((item, index) => {
    const impactClass = `impact-${item.impact}`;
    const impactIcon = item.impact === 'high' ? '🔥' : item.impact === 'medium' ? '⭐' : '💡';
    const number = index + 1;

    html += `
      <li class="suggestion-item ${impactClass}">
        <div class="suggestion-number">${number}</div>
        <div class="suggestion-content">
          <div class="suggestion-action">
            <span class="suggestion-icon">${impactIcon}</span>
            <strong>${item.issue}</strong>
          </div>
          <div class="suggestion-how">${item.suggestion}</div>
        </div>
      </li>
    `;
  });

  html += '</ul>';
  html += '</div>';

  return html;
}

function createRewriteExample(rewriteExample, originalContent) {
  if (!rewriteExample) return '';

  let html = '<div class="virality-rewrite-section">';
  html += '<h3 class="section-title">📝 Your Tweet With Improvements Applied</h3>';
  html += '<p class="rewrite-description">Here\'s what it looks like with the top suggestions applied. Feel free to use it or pick what you like:</p>';

  html += '<div class="rewrite-comparison">';

  // Original
  html += '<div class="rewrite-box rewrite-original">';
  html += '<div class="rewrite-label">Before</div>';
  html += `<div class="rewrite-content">${escapeHtml(originalContent)}</div>`;
  html += '</div>';

  // Improved
  html += '<div class="rewrite-box rewrite-improved">';
  html += '<div class="rewrite-label">After</div>';
  html += `<div class="rewrite-content">${escapeHtml(rewriteExample)}</div>`;
  html += '</div>';

  html += '</div>';

  html += '<button class="btn-apply-rewrite" id="applyRewriteBtn">💡 Try This Version</button>';

  html += '</div>';

  return html;
}

function createRisksList(risks) {
  if (!risks || risks.length === 0) return '';

  let html = '<div class="virality-risks-section">';
  html += '<h3 class="section-title">⚠️ Potential Risks</h3>';
  html += '<ul class="risks-list">';

  risks.forEach(risk => {
    html += `<li class="risk-item">${risk}</li>`;
  });

  html += '</ul>';
  html += '</div>';

  return html;
}

function getImpactBadge(impact) {
  const badges = {
    high: '🔴 High Impact',
    medium: '🟡 Medium Impact',
    low: '🟢 Low Impact'
  };
  return badges[impact] || '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
