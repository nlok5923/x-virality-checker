// Results Modal Component

let currentAnalysis = null;
let currentOriginalContent = null;

function showResultsModal(analysis, originalContent) {
  currentAnalysis = analysis;
  currentOriginalContent = originalContent;

  // Remove existing modal if any
  const existing = document.querySelector('.virality-modal-wrapper');
  if (existing) {
    existing.remove();
  }

  // Create modal wrapper
  const modalWrapper = document.createElement('div');
  modalWrapper.className = 'virality-modal-wrapper';

  // Build modal HTML
  modalWrapper.innerHTML = `
    <div class="virality-modal-backdrop"></div>
    <div class="virality-modal-container">
      <div class="virality-modal-header">
        <h2 class="modal-title">
          <svg class="modal-icon" viewBox="0 0 24 24" width="24" height="24">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>
          </svg>
          Virality Analysis
        </h2>
        <button class="modal-close-btn" id="closeModalBtn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="virality-modal-body">
        ${createScoreCard(analysis)}
        ${createEngagementPrediction(analysis.engagementPrediction)}
        ${createSuggestionsList(analysis.suggestions)}
        ${createStrengthsList(analysis.strengths)}
        ${createRewriteExample(analysis.rewriteExample, originalContent)}
        ${createMetricsBreakdown(analysis.metrics)}
        ${createRisksList(analysis.risks)}

        <div class="virality-footer-info">
          <span class="footer-icon">🤖</span>
          Powered by <strong>Grok AI</strong> • Based on X's recommendation algorithm
        </div>
      </div>

      <div class="virality-modal-footer">
        <button class="btn btn-secondary" id="closeModalFooterBtn">Close</button>
      </div>
    </div>
  `;

  // Append to body
  document.body.appendChild(modalWrapper);

  // Add event listeners
  setupModalEventListeners(modalWrapper);

  // Animate in
  requestAnimationFrame(() => {
    modalWrapper.classList.add('show');
  });
}

function setupModalEventListeners(modalWrapper) {
  // Close button (X)
  const closeBtn = modalWrapper.querySelector('#closeModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal());
  }

  // Close button (footer)
  const closeFooterBtn = modalWrapper.querySelector('#closeModalFooterBtn');
  if (closeFooterBtn) {
    closeFooterBtn.addEventListener('click', () => closeModal());
  }

  // Backdrop click
  const backdrop = modalWrapper.querySelector('.virality-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => closeModal());
  }

  // ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Apply rewrite button
  const applyRewriteBtn = modalWrapper.querySelector('#applyRewriteBtn');
  if (applyRewriteBtn) {
    applyRewriteBtn.addEventListener('click', () => applyRewrite());
  }
}

function closeModal() {
  const modalWrapper = document.querySelector('.virality-modal-wrapper');
  if (modalWrapper) {
    modalWrapper.classList.remove('show');
    setTimeout(() => {
      modalWrapper.remove();
    }, 300); // Match transition duration
  }
}

function applyRewrite() {
  if (!currentAnalysis || !currentAnalysis.rewriteExample) return;

  // Find the active textarea
  const textareas = [
    document.querySelector(TWITTER_SELECTORS.mainCompose),
    document.querySelector(TWITTER_SELECTORS.replyCompose),
    document.querySelector(TWITTER_SELECTORS.dmCompose)
  ];

  const activeTextarea = textareas.find(ta => ta && ta.textContent.trim() === currentOriginalContent.trim());

  if (activeTextarea) {
    // Focus first to ensure the element is active
    activeTextarea.focus();

    // Select all existing content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(activeTextarea);
    selection.removeAllRanges();
    selection.addRange(range);

    // Use execCommand to replace content (this maintains editability)
    document.execCommand('insertText', false, currentAnalysis.rewriteExample);

    // Move cursor to end
    range.selectNodeContents(activeTextarea);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger input events to update character count
    activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    activeTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    activeTextarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    // Show success toast
    showToast('✅ Rewrite applied! Review and edit as needed.', 'success');

    // Close modal
    closeModal();
  } else {
    showToast('❌ Could not find the tweet box. Please copy manually.', 'error');
  }
}

function showLoadingModal() {
  // Remove existing modals
  const existing = document.querySelector('.virality-modal-wrapper');
  if (existing) existing.remove();

  const loadingModal = document.createElement('div');
  loadingModal.className = 'virality-modal-wrapper virality-loading-modal';

  loadingModal.innerHTML = `
    <div class="virality-modal-backdrop"></div>
    <div class="virality-modal-container loading">
      <div class="loading-content">
        <div class="loading-icon">⚡</div>
        <h3 class="loading-title">Analyzing with Grok AI...</h3>
        <p class="loading-subtitle">Evaluating your tweet's virality potential</p>
        <div class="progress-bar-container">
          <div class="progress-bar" id="analysisProgressBar"></div>
        </div>
        <p class="loading-status" id="loadingStatus">Initializing...</p>
      </div>
    </div>
  `;

  document.body.appendChild(loadingModal);

  requestAnimationFrame(() => {
    loadingModal.classList.add('show');
  });

  // Start animated progress
  startProgressAnimation();
}

function startProgressAnimation() {
  const progressBar = document.getElementById('analysisProgressBar');
  const statusText = document.getElementById('loadingStatus');

  if (!progressBar || !statusText) return;

  const stages = [
    { progress: 20, text: 'Analyzing content structure...', duration: 800 },
    { progress: 40, text: 'Evaluating engagement factors...', duration: 1200 },
    { progress: 60, text: 'Calculating virality score...', duration: 1000 },
    { progress: 80, text: 'Generating suggestions...', duration: 1200 },
    { progress: 95, text: 'Finalizing analysis...', duration: 800 }
  ];

  let currentStage = 0;

  function updateProgress() {
    if (currentStage < stages.length) {
      const stage = stages[currentStage];
      progressBar.style.width = stage.progress + '%';
      statusText.textContent = stage.text;
      currentStage++;
      setTimeout(updateProgress, stage.duration);
    }
  }

  // Start animation
  setTimeout(updateProgress, 300);
}

function hideLoadingModal() {
  const loadingModal = document.querySelector('.virality-loading-modal');
  if (loadingModal) {
    loadingModal.remove();
  }
}

function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.virality-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `virality-toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
