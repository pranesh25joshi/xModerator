// Background script for Twitter Content Blocker Extension
// Handles installation, updates, and cross-tab communication

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('xModerator installed:', details.reason);

  try {
    // Initialize default settings if first install
    if (details.reason === 'install') {
      const defaultSettings = {
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

      await chrome.storage.sync.set({ twitterBlockerSettings: defaultSettings });

      // Initialize stats
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

      await chrome.storage.local.set({ blockedStats: defaultStats });

      // Show welcome notification
      showNotification(
        'xModerator Installed!',
        'Click the extension icon to configure your content filters.',
        'install'
      );

      // Open options page for first-time setup
      chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
    }

    // Handle updates
    if (details.reason === 'update') {
      const currentVersion = chrome.runtime.getManifest().version;
      const previousVersion = details.previousVersion;

      console.log(`Updated from version ${previousVersion} to ${currentVersion}`);

      // Show update notification
      showNotification(
        'xModerator Updated!',
        `Updated to version ${currentVersion}. Check out the new features!`,
        'update'
      );

      // Perform any migration tasks if needed
      await handleVersionMigration(previousVersion, currentVersion);
    }

  } catch (error) {
    console.error('Error during extension initialization:', error);
  }
});

// Handle version migrations
async function handleVersionMigration(previousVersion, currentVersion) {
  try {
    // Example: Migrate settings format if needed
    const { twitterBlockerSettings } = await chrome.storage.sync.get(['twitterBlockerSettings']);
    
    if (twitterBlockerSettings) {
      let migrated = false;

      // Add new settings that didn't exist in previous versions
      if (!twitterBlockerSettings.hasOwnProperty('blurInsteadOfHide')) {
        twitterBlockerSettings.blurInsteadOfHide = false;
        migrated = true;
      }

      if (!twitterBlockerSettings.hasOwnProperty('sensitivity')) {
        twitterBlockerSettings.sensitivity = 'medium';
        migrated = true;
      }

      // Ensure all categories exist
      const requiredCategories = ['politics', 'violence', 'adult', 'spam', 'negativity', 'promotions'];
      requiredCategories.forEach(category => {
        if (!twitterBlockerSettings.categories.hasOwnProperty(category)) {
          twitterBlockerSettings.categories[category] = true;
          migrated = true;
        }
      });

      if (migrated) {
        await chrome.storage.sync.set({ twitterBlockerSettings });
        console.log('Settings migrated successfully');
      }
    }

  } catch (error) {
    console.error('Error during version migration:', error);
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getSettings':
      handleGetSettings(sendResponse);
      return true; // Keep channel open for async response

    case 'saveSettings':
      handleSaveSettings(message.settings, sendResponse);
      return true;

    case 'getStats':
      handleGetStats(sendResponse);
      return true;

    case 'resetStats':
      handleResetStats(sendResponse);
      return true;

    case 'toggleExtension':
      handleToggleExtension(message.enabled, sendResponse);
      return true;

    case 'exportData':
      handleExportData(sendResponse);
      return true;

    case 'importData':
      handleImportData(message.data, sendResponse);
      return true;

    default:
      console.warn('Unknown message action:', message.action);
      sendResponse({ error: 'Unknown action' });
  }
});

// Get current settings
async function handleGetSettings(sendResponse) {
  try {
    const { twitterBlockerSettings } = await chrome.storage.sync.get(['twitterBlockerSettings']);
    sendResponse({ success: true, settings: twitterBlockerSettings });
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Save settings
async function handleSaveSettings(settings, sendResponse) {
  try {
    await chrome.storage.sync.set({ twitterBlockerSettings: settings });
    
    // Notify all Twitter tabs about settings change
    notifyTwitterTabs('settingsChanged', { settings });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get stats
async function handleGetStats(sendResponse) {
  try {
    const { blockedStats } = await chrome.storage.local.get(['blockedStats']);
    sendResponse({ success: true, stats: blockedStats });
  } catch (error) {
    console.error('Error getting stats:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Reset stats
async function handleResetStats(sendResponse) {
  try {
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

    await chrome.storage.local.set({ blockedStats: defaultStats });
    sendResponse({ success: true, stats: defaultStats });
  } catch (error) {
    console.error('Error resetting stats:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Toggle extension on/off
async function handleToggleExtension(enabled, sendResponse) {
  try {
    const { twitterBlockerSettings } = await chrome.storage.sync.get(['twitterBlockerSettings']);
    const updatedSettings = { ...twitterBlockerSettings, enabled };
    
    await chrome.storage.sync.set({ twitterBlockerSettings: updatedSettings });
    
    // Notify all Twitter tabs
    notifyTwitterTabs('toggle', { enabled });
    
    sendResponse({ success: true, enabled });
  } catch (error) {
    console.error('Error toggling extension:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Export user data
async function handleExportData(sendResponse) {
  try {
    const { twitterBlockerSettings } = await chrome.storage.sync.get(['twitterBlockerSettings']);
    const { blockedStats } = await chrome.storage.local.get(['blockedStats']);

    const exportData = {
      version: chrome.runtime.getManifest().version,
      exportDate: new Date().toISOString(),
      settings: twitterBlockerSettings,
      stats: blockedStats
    };

    sendResponse({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Import user data
async function handleImportData(data, sendResponse) {
  try {
    // Validate import data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data format');
    }

    if (data.settings) {
      await chrome.storage.sync.set({ twitterBlockerSettings: data.settings });
    }

    if (data.stats) {
      await chrome.storage.local.set({ blockedStats: data.stats });
    }

    // Notify all Twitter tabs about settings change
    if (data.settings) {
      notifyTwitterTabs('settingsChanged', { settings: data.settings });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error importing data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Notify all Twitter tabs
async function notifyTwitterTabs(action, data) {
  try {
    const tabs = await chrome.tabs.query({ 
      url: ['*://twitter.com/*', '*://x.com/*'] 
    });

    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action, ...data });
      } catch (error) {
        // Tab might be loading or content script not ready
        console.log(`Could not notify tab ${tab.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error notifying Twitter tabs:', error);
  }
}

// Show notification
function showNotification(title, message, type = 'info') {
  // Create notification
  chrome.notifications.create(`twitter-blocker-${type}-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// Daily stats reset
function checkDailyReset() {
  chrome.storage.local.get(['blockedStats']).then(({ blockedStats }) => {
    if (blockedStats) {
      const today = new Date().toDateString();
      if (blockedStats.lastResetDate !== today) {
        const updatedStats = {
          ...blockedStats,
          blockedToday: 0,
          lastResetDate: today
        };
        chrome.storage.local.set({ blockedStats: updatedStats });
      }
    }
  }).catch(error => {
    console.error('Error checking daily reset:', error);
  });
}

// Set up daily reset check
chrome.alarms.create('dailyReset', { periodInMinutes: 60 }); // Check every hour
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    checkDailyReset();
  }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url?.includes('twitter.com') || tab.url?.includes('x.com'))) {
    
    // Ensure content script is loaded
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/utils/storage.js', 'src/utils/detector.js']
    }).catch(error => {
      // Script might already be loaded
      console.log('Content script injection info:', error.message);
    });
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.includes('twitter-blocker')) {
    // Open options page
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
    chrome.notifications.clear(notificationId);
  }
});

console.log('xModerator background script loaded');