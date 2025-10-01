// Storage utility functions for xModerator Extension

class StorageManager {
  constructor() {
    this.defaultSettings = {
      enabled: true,
      categories: {
        politics: true,
        violence: true,
        adult: true,
        spam: true,
        negativity: true,
        promotions: true
      },
      customKeywords: [],
      blockedUsers: [],
      sensitivity: 'medium', // low, medium, high
      showBlockedCount: true,
      blurInsteadOfHide: false
    };
  }

  // Get all settings
  async getSettings() {
    try {
      const result = await chrome.storage.sync.get(['twitterBlockerSettings']);
      return { ...this.defaultSettings, ...result.twitterBlockerSettings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.defaultSettings;
    }
  }

  // Save settings
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set({ twitterBlockerSettings: settings });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // Get specific setting
  async getSetting(key) {
    const settings = await this.getSettings();
    return settings[key];
  }

  // Update specific setting
  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    return await this.saveSettings(settings);
  }

  // Add custom keyword
  async addKeyword(keyword) {
    const settings = await this.getSettings();
    if (!settings.customKeywords.includes(keyword.toLowerCase())) {
      settings.customKeywords.push(keyword.toLowerCase());
      return await this.saveSettings(settings);
    }
    return false;
  }

  // Remove custom keyword
  async removeKeyword(keyword) {
    const settings = await this.getSettings();
    settings.customKeywords = settings.customKeywords.filter(
      k => k !== keyword.toLowerCase()
    );
    return await this.saveSettings(settings);
  }

  // Add blocked user
  async addBlockedUser(username) {
    const settings = await this.getSettings();
    const cleanUsername = username.replace('@', '').toLowerCase();
    if (!settings.blockedUsers.includes(cleanUsername)) {
      settings.blockedUsers.push(cleanUsername);
      return await this.saveSettings(settings);
    }
    return false;
  }

  // Remove blocked user
  async removeBlockedUser(username) {
    const settings = await this.getSettings();
    const cleanUsername = username.replace('@', '').toLowerCase();
    settings.blockedUsers = settings.blockedUsers.filter(
      u => u !== cleanUsername
    );
    return await this.saveSettings(settings);
  }

  // Get stats
  async getStats() {
    try {
      const result = await chrome.storage.local.get(['blockedStats']);
      return result.blockedStats || {
        totalBlocked: 0,
        blockedToday: 0,
        lastResetDate: new Date().toDateString(),
        categoryStats: {
          politics: 0,
          violence: 0,
          adult: 0,
          spam: 0,
          negativity: 0,
          promotions: 0,
          keywords: 0,
          users: 0
        }
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }

  // Update stats
  async updateStats(category) {
    const stats = await this.getStats();
    const today = new Date().toDateString();
    
    // Reset daily count if new day
    if (stats.lastResetDate !== today) {
      stats.blockedToday = 0;
      stats.lastResetDate = today;
    }
    
    stats.totalBlocked++;
    stats.blockedToday++;
    
    if (category && stats.categoryStats[category] !== undefined) {
      stats.categoryStats[category]++;
    }
    
    try {
      await chrome.storage.local.set({ blockedStats: stats });
      return stats;
    } catch (error) {
      console.error('Error updating stats:', error);
      return stats;
    }
  }

  // Reset stats
  async resetStats() {
    const defaultStats = {
      totalBlocked: 0,
      blockedToday: 0,
      lastResetDate: new Date().toDateString(),
      categoryStats: {
        politics: 0,
        violence: 0,
        adult: 0,
        spam: 0,
        negativity: 0,
        promotions: 0,
        keywords: 0,
        users: 0
      }
    };
    
    try {
      await chrome.storage.local.set({ blockedStats: defaultStats });
      return true;
    } catch (error) {
      console.error('Error resetting stats:', error);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
} else {
  window.StorageManager = StorageManager;
}