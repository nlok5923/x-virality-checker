// Chrome Storage Utilities

const StorageManager = {
  // Get Grok API key
  async getApiKey() {
    const result = await chrome.storage.sync.get('grokApiKey');
    return result.grokApiKey || null;
  },

  // Save Grok API key
  async saveApiKey(apiKey) {
    await chrome.storage.sync.set({ grokApiKey: apiKey });
  },

  // Get settings
  async getSettings() {
    const result = await chrome.storage.sync.get('settings');
    return result.settings || {
      autoAnalyze: false,
      showWarnings: true,
      saveHistory: true,
      theme: 'auto' // 'light', 'dark', 'auto'
    };
  },

  // Save settings
  async saveSettings(settings) {
    await chrome.storage.sync.set({ settings });
  },

  // Get usage statistics
  async getUsageStats() {
    const result = await chrome.storage.local.get('usageStats');
    return result.usageStats || {
      analysisCount: 0,
      totalCost: 0,
      lastResetDate: new Date().toISOString(),
      monthlyAnalyses: []
    };
  },

  // Update usage statistics
  async updateUsageStats(cost) {
    const stats = await this.getUsageStats();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    stats.analysisCount += 1;
    stats.totalCost += cost;

    // Add to monthly tracking
    if (!stats.monthlyAnalyses.find(m => m.month === currentMonth)) {
      stats.monthlyAnalyses.push({ month: currentMonth, count: 0, cost: 0 });
    }

    const monthlyEntry = stats.monthlyAnalyses.find(m => m.month === currentMonth);
    monthlyEntry.count += 1;
    monthlyEntry.cost += cost;

    await chrome.storage.local.set({ usageStats: stats });
    return stats;
  },

  // Save analysis to history
  async saveToHistory(analysis) {
    const settings = await this.getSettings();
    if (!settings.saveHistory) return;

    const result = await chrome.storage.local.get('analysisHistory');
    const history = result.analysisHistory || [];

    history.unshift({
      timestamp: new Date().toISOString(),
      content: analysis.originalContent,
      score: analysis.overallScore,
      rating: analysis.rating
    });

    // Keep only last 50 analyses
    if (history.length > 50) {
      history.length = 50;
    }

    await chrome.storage.local.set({ analysisHistory: history });
  },

  // Get analysis history
  async getHistory() {
    const result = await chrome.storage.local.get('analysisHistory');
    return result.analysisHistory || [];
  },

  // Clear history
  async clearHistory() {
    await chrome.storage.local.remove('analysisHistory');
  },

  // Rate limiting check
  async canAnalyze() {
    const result = await chrome.storage.local.get('lastAnalysisTime');
    const lastTime = result.lastAnalysisTime || 0;
    const now = Date.now();

    if (now - lastTime < RATE_LIMIT.cooldownMs) {
      const waitTime = Math.ceil((RATE_LIMIT.cooldownMs - (now - lastTime)) / 1000);
      return { allowed: false, waitTime };
    }

    return { allowed: true };
  },

  // Update last analysis time
  async recordAnalysis() {
    await chrome.storage.local.set({ lastAnalysisTime: Date.now() });
  }
};
