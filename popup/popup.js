// Popup Script - Settings and Configuration

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadUsageStats();
  setupEventListeners();
});

// Load saved settings
async function loadSettings() {
  try {
    // Load settings
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
  // Save history checkbox
  document.getElementById('saveHistoryCheckbox').addEventListener('change', saveSettings);

  // Show warnings checkbox
  document.getElementById('showWarningsCheckbox').addEventListener('change', saveSettings);

  // View history
  document.getElementById('viewHistoryBtn').addEventListener('click', viewHistory);

  // Clear history
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
}

// Save general settings
async function saveSettings() {
  try {
    const settings = {
      saveHistory: document.getElementById('saveHistoryCheckbox').checked,
      showWarnings: document.getElementById('showWarningsCheckbox').checked
    };

    await chrome.storage.sync.set({ settings });
    console.log('Settings saved successfully');

  } catch (error) {
    console.error('Error saving settings:', error);
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
    alert('History cleared successfully!');
  } catch (error) {
    console.error('Error clearing history:', error);
    alert('Error clearing history. Please try again.');
  }
}
