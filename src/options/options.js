// Options page script for Twitter Content Blocker Extension

class OptionsManager {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.currentTab = 'general';
    this.unsavedChanges = false;
    
    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.setupEventListeners();
      this.updateUI();
      this.startAutoSave();
    } catch (error) {
      console.error('Error initializing options:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  async loadData() {
    // Load settings directly from storage
    const storageManager = new StorageManager();
    this.settings = await storageManager.getSettings();
    this.stats = await storageManager.getStats();
    
    console.log('📊 Options: Loaded data', { settings: this.settings, stats: this.stats });
  }

  getDefaultSettings() {
    return {
      enabled: true,
      categories: {
        politics: true,
        violence: true,
        adult: true,
        spam: true,
        negativity: false,
        promotions: false
      },
      customKeywords: [],
      blockedUsers: [],
      sensitivity: 'medium',
      showBlockedCount: true,
      blurInsteadOfHide: false
    };
  }

  setupEventListeners() {
    // Tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // General settings
    document.getElementById('enabled-setting').addEventListener('change', (e) => {
      this.updateSetting('enabled', e.target.checked);
    });

    document.getElementById('sensitivity-setting').addEventListener('change', (e) => {
      this.updateSetting('sensitivity', e.target.value);
    });

    document.getElementById('show-counter-setting').addEventListener('change', (e) => {
      this.updateSetting('showBlockedCount', e.target.checked);
    });

    // Blocking method radio buttons
    const blockingMethodRadios = document.querySelectorAll('input[name="blocking-method"]');
    blockingMethodRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateSetting('blurInsteadOfHide', e.target.value === 'blur');
      });
    });

    // Category toggles
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      const toggle = card.querySelector('input[type="checkbox"]');
      const category = card.dataset.category;
      
      toggle.addEventListener('change', (e) => {
        this.updateCategorySetting(category, e.target.checked);
      });
    });

    // Keywords
    document.getElementById('add-keyword-btn').addEventListener('click', () => {
      this.addKeyword();
    });

    document.getElementById('keyword-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addKeyword();
      }
    });

    // Users
    document.getElementById('add-user-btn').addEventListener('click', () => {
      this.addBlockedUser();
    });

    document.getElementById('user-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addBlockedUser();
      }
    });

    // Statistics
    document.getElementById('reset-stats-btn').addEventListener('click', () => {
      this.resetStats();
    });

    // Import/Export
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
    });

    // Save button
    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.saveSettings();
    });

    // Warn about unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    this.currentTab = tabName;

    // Update UI for specific tabs
    if (tabName === 'stats') {
      this.updateStatsUI();
    }
  }

  updateUI() {
    // General settings
    document.getElementById('enabled-setting').checked = this.settings.enabled;
    document.getElementById('sensitivity-setting').value = this.settings.sensitivity || 'medium';
    document.getElementById('show-counter-setting').checked = this.settings.showBlockedCount;

    // Blocking method
    const blockingMethod = this.settings.blurInsteadOfHide ? 'blur' : 'hide';
    document.querySelector(`input[name="blocking-method"][value="${blockingMethod}"]`).checked = true;

    // Categories
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      const category = card.dataset.category;
      const toggle = card.querySelector('input[type="checkbox"]');
      toggle.checked = this.settings.categories?.[category] || false;
    });

    // Keywords and users
    this.updateKeywordsList();
    this.updateUsersList();
    this.updateStatsUI();
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.markUnsaved();
  }

  updateCategorySetting(category, enabled) {
    if (!this.settings.categories) {
      this.settings.categories = {};
    }
    this.settings.categories[category] = enabled;
    this.markUnsaved();
  }

  addKeyword() {
    const input = document.getElementById('keyword-input');
    const keyword = input.value.trim().toLowerCase();

    if (!keyword) {
      this.showToast('Please enter a keyword', 'error');
      return;
    }

    if (keyword.length > 50) {
      this.showToast('Keyword too long (max 50 characters)', 'error');
      return;
    }

    if (this.settings.customKeywords.includes(keyword)) {
      this.showToast('Keyword already exists', 'error');
      return;
    }

    this.settings.customKeywords.push(keyword);
    input.value = '';
    this.updateKeywordsList();
    this.markUnsaved();
    this.showToast('Keyword added', 'success');
  }

  removeKeyword(keyword) {
    this.settings.customKeywords = this.settings.customKeywords.filter(k => k !== keyword);
    this.updateKeywordsList();
    this.markUnsaved();
    this.showToast('Keyword removed', 'success');
  }

  updateKeywordsList() {
    const container = document.getElementById('keywords-list');
    
    if (!this.settings.customKeywords || this.settings.customKeywords.length === 0) {
      container.innerHTML = '<p class="empty-state">No custom keywords added yet</p>';
      return;
    }

    container.innerHTML = this.settings.customKeywords.map(keyword => `
      <div class="keyword-item">
        <span class="keyword-text">${this.escapeHtml(keyword)}</span>
        <button class="remove-btn" onclick="optionsManager.removeKeyword('${keyword}')">Remove</button>
      </div>
    `).join('');
  }

  addBlockedUser() {
    const input = document.getElementById('user-input');
    const username = input.value.trim().replace('@', '').toLowerCase();

    if (!username) {
      this.showToast('Please enter a username', 'error');
      return;
    }

    if (username.length > 30) {
      this.showToast('Username too long (max 30 characters)', 'error');
      return;
    }

    if (this.settings.blockedUsers.includes(username)) {
      this.showToast('User already blocked', 'error');
      return;
    }

    this.settings.blockedUsers.push(username);
    input.value = '';
    this.updateUsersList();
    this.markUnsaved();
    this.showToast('User blocked', 'success');
  }

  removeBlockedUser(username) {
    this.settings.blockedUsers = this.settings.blockedUsers.filter(u => u !== username);
    this.updateUsersList();
    this.markUnsaved();
    this.showToast('User unblocked', 'success');
  }

  updateUsersList() {
    const container = document.getElementById('users-list');
    
    if (!this.settings.blockedUsers || this.settings.blockedUsers.length === 0) {
      container.innerHTML = '<p class="empty-state">No users blocked yet</p>';
      return;
    }

    container.innerHTML = this.settings.blockedUsers.map(username => `
      <div class="user-item">
        <span class="user-text">@${this.escapeHtml(username)}</span>
        <button class="remove-btn" onclick="optionsManager.removeBlockedUser('${username}')">Unblock</button>
      </div>
    `).join('');
  }

  updateStatsUI() {
    if (!this.stats) return;

    // Overview stats
    document.getElementById('total-blocked-stat').textContent = this.stats.totalBlocked || 0;
    document.getElementById('today-blocked-stat').textContent = this.stats.blockedToday || 0;
    
    // Calculate daily average (rough estimate)
    const totalDays = Math.max(1, Math.floor((Date.now() - new Date(this.stats.lastResetDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    const avgDaily = Math.round((this.stats.totalBlocked || 0) / totalDays);
    document.getElementById('avg-daily-stat').textContent = avgDaily;

    // Category stats
    const categoryStatsContainer = document.getElementById('category-stats-list');
    const categoryStats = this.stats.categoryStats || {};
    
    const categoryNames = {
      politics: 'Politics',
      violence: 'Violence',
      adult: 'Adult Content',
      spam: 'Spam',
      negativity: 'Negativity',
      promotions: 'Promotions',
      keywords: 'Custom Keywords',
      users: 'Blocked Users'
    };

    categoryStatsContainer.innerHTML = Object.entries(categoryNames).map(([key, name]) => `
      <div class="category-stat-item">
        <span class="category-stat-name">${name}</span>
        <span class="category-stat-count">${categoryStats[key] || 0}</span>
      </div>
    `).join('');
  }

  async resetStats() {
    if (!confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'resetStats' });
      if (response.success) {
        this.stats = response.stats;
        this.updateStatsUI();
        this.showToast('Statistics reset', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      this.showToast('Failed to reset statistics', 'error');
    }
  }

  async exportData() {
    try {
      const response = await this.sendMessage({ action: 'exportData' });
      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `twitter-content-blocker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Data exported successfully', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  async importData(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.settings && !data.stats) {
        throw new Error('Invalid backup file format');
      }

      const response = await this.sendMessage({ action: 'importData', data });
      if (response.success) {
        // Reload data and update UI
        await this.loadData();
        this.updateUI();
        this.showToast('Data imported successfully', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      this.showToast('Failed to import data', 'error');
    }
  }

  async saveSettings() {
    try {
      const storageManager = new StorageManager();
      const success = await storageManager.saveSettings(this.settings);

      if (success) {
        this.markSaved();
        this.showToast('Settings saved', 'success');
        console.log('✅ Options: Settings saved successfully', this.settings);
      } else {
        throw new Error('Storage operation failed');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  startAutoSave() {
    // Auto-save every 10 seconds if there are unsaved changes
    setInterval(() => {
      if (this.unsavedChanges) {
        this.saveSettings();
      }
    }, 10000);
  }

  markUnsaved() {
    this.unsavedChanges = true;
    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.textContent = 'Save Settings*';
    saveBtn.classList.add('unsaved');
  }

  markSaved() {
    this.unsavedChanges = false;
    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.textContent = 'Save Settings';
    saveBtn.classList.remove('unsaved');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize options manager
let optionsManager;
document.addEventListener('DOMContentLoaded', () => {
  optionsManager = new OptionsManager();
});