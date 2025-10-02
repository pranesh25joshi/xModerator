// Storage utility functions for xModerator Extension

class StorageManager {
  constructor() {
    this.defaultSettings = {
      enabled: true,
      categories: {
        politics: true,
        violence: true,
        adult: true,
        spam: false,
        negativity: false,
        promotions: false
      },
      customKeywords: [],
      blockedUsers: [],
      sensitivity: 'medium', // low, medium, high
      showBlockedCount: true,
      blurInsteadOfHide: true
    };
  }

  // Get all settings
  async getSettings() {
    try {
      const result = await chrome.storage.sync.get(['xModeratorSettings']);
      return { ...this.defaultSettings, ...result.xModeratorSettings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.defaultSettings;
    }
  }

  // Save settings
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set({ xModeratorSettings: settings });
      console.log('✅ xModerator: Settings saved successfully', settings);
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
      const result = await chrome.storage.local.get(['xModeratorStats']);
      return result.xModeratorStats || {
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
      await chrome.storage.local.set({ xModeratorStats: stats });
      console.log('📊 xModerator: Stats updated', stats);
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
      await chrome.storage.local.set({ xModeratorStats: defaultStats });
      return true;
    } catch (error) {
      console.error('Error resetting stats:', error);
      return false;
    }
  }

  // Get keyword preferences
  async getKeywordPreferences() {
    try {
      const result = await chrome.storage.local.get(['keywordPreferences']);
      return result.keywordPreferences || {};
    } catch (error) {
      console.error('Error getting keyword preferences:', error);
      return {};
    }
  }

  // Save keyword preferences
  async saveKeywordPreferences(preferences) {
    try {
      await chrome.storage.local.set({ keywordPreferences: preferences });
      console.log('✅ xModerator: Keyword preferences saved', preferences);
      return true;
    } catch (error) {
      console.error('Error saving keyword preferences:', error);
      return false;
    }
  }

  // Update keyword preference for a specific category and keyword
  async updateKeywordPreference(category, keyword, enabled) {
    const preferences = await this.getKeywordPreferences();
    
    if (!preferences[category]) {
      preferences[category] = {};
    }
    
    preferences[category][keyword] = enabled;
    return await this.saveKeywordPreferences(preferences);
  }

  // Reset keyword preferences to defaults (all enabled)
  async resetKeywordPreferences() {
    try {
      await chrome.storage.local.remove(['keywordPreferences']);
      console.log('✅ xModerator: Keyword preferences reset to defaults');
      return true;
    } catch (error) {
      console.error('Error resetting keyword preferences:', error);
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