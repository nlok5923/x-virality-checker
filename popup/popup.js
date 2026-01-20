// Popup Script - Settings and Configuration

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadUsageStats();
  setupEventListeners();
});

// Load saved settings
async function loadSettings() {
  try {
    // Load API key
    const { grokApiKey } = await chrome.storage.sync.get('grokApiKey');
    const apiKeyInput = document.getElementById('apiKeyInput');

    if (grokApiKey) {
      apiKeyInput.value = grokApiKey;
      showStatus('API key configured ✓', 'success');
    } else {
      showStatus('Please enter your Grok API key', 'info');
    }

    // Load other settings
    const { settings } = await chrome.storage.sync.get('settings');
    const defaultSettings = {
      saveHistory: true,
      showWarnings: true
    };

    const currentSettings = settings || defaultSettings;

    document.getElementById('saveHistoryCheckbox').checked = currentSettings.saveHistory;
    document.getElementById('showWarningsCheckbox').checked = currentSettings.showWarnings;

  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

// Load usage statistics
async function loadUsageStats() {
  try {
    const { usageStats } = await chrome.storage.local.get('usageStats');

    if (usageStats) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyData = usageStats.monthlyAnalyses?.find(m => m.month === currentMonth);

      document.getElementById('analysisCount').textContent = monthlyData?.count || 0;
      document.getElementById('totalCost').textContent = `$${(monthlyData?.cost || 0).toFixed(4)}`;
    } else {
      document.getElementById('analysisCount').textContent = '0';
      document.getElementById('totalCost').textContent = '$0.00';
    }
  } catch (error) {
    console.error('Error loading usage stats:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Save API key
  document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);

  // Toggle API key visibility
  document.getElementById('toggleKeyVisibility').addEventListener('click', toggleKeyVisibility);

  // API key input - also trigger save on Enter
  document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });

  // Save history checkbox
  document.getElementById('saveHistoryCheckbox').addEventListener('change', saveSettings);

  // Show warnings checkbox
  document.getElementById('showWarningsCheckbox').addEventListener('change', saveSettings);

  // View history
  document.getElementById('viewHistoryBtn').addEventListener('click', viewHistory);

  // Clear history
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
}

// Save API key
async function saveApiKey() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus('Please enter a valid API key', 'error');
    return;
  }

  try {
    // Test the API key by making a simple request
    showStatus('Testing API key...', 'info');

    const testResponse = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!testResponse.ok) {
      if (testResponse.status === 401) {
        showStatus('Invalid API key. Please check and try again.', 'error');
        return;
      } else if (testResponse.status === 402) {
        showStatus('API key valid but no credits. Please add credits to your Grok account.', 'warning');
        // Still save the key even if no credits
      } else {
        showStatus(`API error (${testResponse.status}). Saving key anyway.`, 'warning');
      }
    }

    // Save the API key
    await chrome.storage.sync.set({ grokApiKey: apiKey });
    showStatus('API key saved successfully! ✓', 'success');

  } catch (error) {
    console.error('Error saving API key:', error);
    // Save anyway if network error (might be offline)
    await chrome.storage.sync.set({ grokApiKey: apiKey });
    showStatus('API key saved (could not verify - check your connection)', 'warning');
  }
}

// Toggle API key visibility
function toggleKeyVisibility() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const eyeIcon = document.getElementById('eyeIcon');

  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    `;
  } else {
    apiKeyInput.type = 'password';
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    `;
  }
}

// Save general settings
async function saveSettings() {
  try {
    const settings = {
      saveHistory: document.getElementById('saveHistoryCheckbox').checked,
      showWarnings: document.getElementById('showWarningsCheckbox').checked
    };

    await chrome.storage.sync.set({ settings });
    showStatus('Settings saved ✓', 'success');

  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

// View history
async function viewHistory() {
  try {
    const { analysisHistory } = await chrome.storage.local.get('analysisHistory');
    const history = analysisHistory || [];

    if (history.length === 0) {
      alert('No analysis history yet. Start analyzing tweets to build your history!');
      return;
    }

    let historyText = 'Analysis History:\n\n';
    history.forEach((item, index) => {
      const date = new Date(item.timestamp).toLocaleString();
      historyText += `${index + 1}. ${date}\n`;
      historyText += `   Score: ${item.score} (${item.rating})\n`;
      historyText += `   Content: ${item.content.substring(0, 60)}${item.content.length > 60 ? '...' : ''}\n\n`;
    });

    // Create a modal or new tab to show history
    alert(historyText);

  } catch (error) {
    console.error('Error viewing history:', error);
    alert('Error loading history');
  }
}

// Clear history
async function clearHistory() {
  const confirmed = confirm('Are you sure you want to clear all analysis history? This cannot be undone.');

  if (!confirmed) return;

  try {
    await chrome.storage.local.remove('analysisHistory');
    showStatus('History cleared ✓', 'success');
  } catch (error) {
    console.error('Error clearing history:', error);
    showStatus('Error clearing history', 'error');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('apiKeyStatus');
  statusElement.textContent = message;
  statusElement.className = `status-message status-${type}`;

  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'status-message';
    }, 5000);
  }
}
