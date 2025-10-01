// Popup script for xModerator Extension

class PopupManager {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.isLoading = true;
    
    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.setupEventListeners();
      this.updateUI();
      this.isLoading = false;
      console.log('✅ Popup: Initialization complete');
    } catch (error) {
      console.error('❌ Popup: Error initializing popup:', error);
      this.isLoading = false; // Important: stop loading even on error
      this.showError('Failed to load extension data');
    }
  }

  async loadData() {
    // Load settings and stats directly from storage
    const storageManager = new StorageManager();
    this.settings = await storageManager.getSettings();
    this.stats = await storageManager.getStats();
    
    console.log('📊 Popup: Loaded data', { settings: this.settings, stats: this.stats });
  }

  setupEventListeners() {
    // Main toggle
    const enabledToggle = document.getElementById('enabled-toggle');
    enabledToggle.addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    // Category checkboxes
    const categoryInputs = document.querySelectorAll('[data-category]');
    categoryInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.updateCategory(e.target.dataset.category, e.target.checked);
      });
    });

    // Action buttons
    document.getElementById('rescan-btn').addEventListener('click', () => {
      this.rescanPage();
    });

    document.getElementById('reset-stats-btn').addEventListener('click', () => {
      this.resetStats();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openSettings();
    });
  }

  updateUI() {
    // Update main toggle
    const enabledToggle = document.getElementById('enabled-toggle');
    enabledToggle.checked = this.settings.enabled || false;

    // Update status
    const statusText = document.getElementById('status-text');
    statusText.textContent = this.settings.enabled ? 'Active' : 'Disabled';
    statusText.className = `status-value ${this.settings.enabled ? 'active' : 'disabled'}`;

    // Update stats
    document.getElementById('blocked-today').textContent = this.stats.blockedToday || 0;
    document.getElementById('blocked-total').textContent = this.stats.totalBlocked || 0;

    // Update category checkboxes
    const categoryInputs = document.querySelectorAll('[data-category]');
    categoryInputs.forEach(input => {
      const category = input.dataset.category;
      input.checked = this.settings.categories?.[category] || false;
    });

    // Update container state
    const container = document.querySelector('.popup-container');
    container.classList.toggle('disabled', !this.settings.enabled);
  }

  async toggleExtension(enabled) {
    try {
      // Update local settings
      this.settings.enabled = enabled;
      
      // Save to storage
      const storageManager = new StorageManager();
      const success = await storageManager.saveSettings(this.settings);

      if (success) {
        this.updateUI();
        this.showSuccess(enabled ? 'Extension enabled' : 'Extension disabled');
        console.log('✅ Popup: Extension toggled', { enabled });
        
        // Send message to content script
        this.sendMessageToTab({ action: 'toggle', enabled });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error toggling extension:', error);
      this.showError('Failed to toggle extension');
      
      // Revert toggle
      const enabledToggle = document.getElementById('enabled-toggle');
      enabledToggle.checked = this.settings.enabled;
    }
  }

  async updateCategory(category, enabled) {
    try {
      // Update local settings
      if (!this.settings.categories) {
        this.settings.categories = {};
      }
      this.settings.categories[category] = enabled;

      // Save to storage
      const storageManager = new StorageManager();
      const success = await storageManager.saveSettings(this.settings);

      if (success) {
        this.showSuccess(`${this.getCategoryDisplayName(category)} filter ${enabled ? 'enabled' : 'disabled'}`);
        console.log('✅ Popup: Category updated', { category, enabled });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      this.showError('Failed to update filter');
      
      // Revert checkbox
      const checkbox = document.querySelector(`[data-category="${category}"]`);
      checkbox.checked = !enabled;
    }
  }

  async rescanPage() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });

      if (!tab || (!tab.url.includes('twitter.com') && !tab.url.includes('x.com'))) {
        this.showError('Please navigate to Twitter first');
        return;
      }

      // Send rescan message to content script
      await chrome.tabs.sendMessage(tab.id, { action: 'rescan' });
      this.showSuccess('Page rescanned');
      
      // Reload stats after a short delay
      setTimeout(() => {
        this.loadData().then(() => this.updateUI());
      }, 1000);

    } catch (error) {
      console.error('Error rescanning page:', error);
      this.showError('Failed to rescan page');
    }
  }

  async resetStats() {
    try {
      const storageManager = new StorageManager();
      const success = await storageManager.resetStats();
      
      if (success) {
        this.stats = await storageManager.getStats();
        this.updateUI();
        this.showSuccess('Statistics reset');
        console.log('✅ Popup: Stats reset successfully');
      } else {
        throw new Error('Failed to reset stats');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      this.showError('Failed to reset statistics');
    }
  }

  openSettings() {
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('src/options/options.html') 
    });
    window.close();
  }

  getCategoryDisplayName(category) {
    const displayNames = {
      politics: 'Politics',
      violence: 'Violence',
      adult: 'Adult Content',
      spam: 'Spam',
      negativity: 'Negativity',
      promotions: 'Promotions'
    };
    
    return displayNames[category] || category;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to popup
    const container = document.querySelector('.popup-container');
    container.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  async sendMessageToTab(message) {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });

      if (tab && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
        chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (error) {
      console.error('Error sending message to tab:', error);
    }
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

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Handle popup close
window.addEventListener('beforeunload', () => {
  console.log('Popup closing');
});