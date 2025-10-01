// Main content script for xModerator
// This script runs on Twitter/X pages and filters unwanted content

(function() {
  'use strict';

  // Import utilities (loaded via manifest)
  let storageManager;
  let contentDetector;
  let isEnabled = true;
  let settings = {};
  let stats = {};

  // Initialize the extension
  async function init() {
    try {
      console.log('🛡️ xModerator: Starting up on', window.location.hostname);
      
      // Create utility instances
      storageManager = new StorageManager();
      contentDetector = new ContentDetector();

      // Load settings and stats
      settings = await storageManager.getSettings();
      stats = await storageManager.getStats();
      isEnabled = settings.enabled;

      console.log('🛡️ xModerator initialized successfully!', { isEnabled, settings });

      // Show a brief notification that extension is active
      showExtensionStatus();

      // Start monitoring
      if (isEnabled) {
        startContentMonitoring();
        addBlockedCounter();
      }

      // Listen for settings changes
      chrome.storage.onChanged.addListener(handleStorageChanges);

    } catch (error) {
      console.error('🚫 xModerator initialization failed:', error);
    }
  }

  // Handle storage changes from settings page
  function handleStorageChanges(changes, namespace) {
    if (changes.xModeratorSettings) {
      console.log('🔄 xModerator: Settings changed', changes.xModeratorSettings);
      settings = { ...settings, ...changes.xModeratorSettings.newValue };
      isEnabled = settings.enabled;
      
      if (isEnabled) {
        startContentMonitoring();
      } else {
        stopContentMonitoring();
        showAllTweets();
      }
    }
  }

  // Start monitoring for tweets to filter
  function startContentMonitoring() {
    console.log('🔍 xModerator: Starting content monitoring...');
    
    // Initial scan
    scanExistingTweets();

    // Monitor for new content using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a tweet or contains tweets
            if (node.matches && (node.matches('[data-testid="tweet"]') || 
                node.querySelector('[data-testid="tweet"]'))) {
              const tweets = node.matches('[data-testid="tweet"]') ? 
                [node] : node.querySelectorAll('[data-testid="tweet"]');
              
              tweets.forEach(tweet => {
                console.log('🐦 xModerator: Found new tweet, processing...');
                processTweet(tweet);
              });
            }
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Store observer reference for cleanup
    window.xModeratorObserver = observer;
    console.log('👁️ xModerator: Observer started and monitoring tweets');
  }

  // Stop content monitoring
  function stopContentMonitoring() {
    if (window.xModeratorObserver) {
      window.xModeratorObserver.disconnect();
      window.xModeratorObserver = null;
      console.log('⏹️ xModerator: Stopped monitoring');
    }
  }

  // Scan existing tweets on page
  function scanExistingTweets() {
    console.log('🔍 xModerator: Scanning existing tweets...');
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    console.log(`📊 xModerator: Found ${tweets.length} existing tweets to scan`);
    tweets.forEach(tweet => processTweet(tweet));
  }

  // Process individual tweet
  async function processTweet(tweetElement) {
    if (!tweetElement || tweetElement.hasAttribute('data-xmoderator-processed')) {
      return;
    }

    // Mark as processed to avoid duplicate processing
    tweetElement.setAttribute('data-xmoderator-processed', 'true');

    try {
      // Extract tweet data
      const tweetData = extractTweetData(tweetElement);
      if (!tweetData.text && !tweetData.username) {
        return;
      }

      console.log('🔍 xModerator: Processing tweet:', {
        username: tweetData.username,
        text: tweetData.text.substring(0, 100) + '...'
      });

      // Check blocked users first
      if (settings.blockedUsers.includes(tweetData.username.toLowerCase())) {
        console.log('🚫 xModerator: Blocking tweet from blocked user:', tweetData.username);
        await blockTweet(tweetElement, 'user', `Blocked user: @${tweetData.username}`);
        return;
      }

      // Check custom keywords
      if (contentDetector.checkCustomKeywords(tweetData.text, settings.customKeywords)) {
        console.log('🚫 xModerator: Blocking tweet for custom keyword');
        await blockTweet(tweetElement, 'keywords', 'Contains blocked keyword');
        return;
      }

      // Analyze content for unwanted categories
      const analysis = contentDetector.analyzeContent(
        tweetData.text, 
        tweetData.username, 
        settings.sensitivity
      );

      console.log('🔍 xModerator: Analyzed tweet:', {
        text: tweetData.text.substring(0, 50) + '...',
        categories: analysis.categories,
        shouldBlock: analysis.shouldBlock
      });

      // Check if any enabled categories were detected
      const blockedCategories = analysis.categories.filter(cat => 
        settings.categories[cat.category] === true
      );

      if (analysis.shouldBlock && blockedCategories.length > 0) {
        const primaryCategory = blockedCategories[0].category;
        const reason = `${contentDetector.getCategoryDisplayName(primaryCategory)} content detected`;
        console.log('🚫 xModerator: Blocking tweet for', primaryCategory, ':', reason);
        await blockTweet(tweetElement, primaryCategory, reason);
      } else {
        console.log('✅ xModerator: Tweet passed all filters');
      }

    } catch (error) {
      console.error('❌ xModerator: Error processing tweet:', error);
    }
  }

  // Extract tweet text and metadata
  function extractTweetData(tweetElement) {
    const data = {
      text: '',
      username: '',
      isRetweet: false,
      hasMedia: false
    };

    try {
      // Get tweet text
      const textElement = tweetElement.querySelector('[data-testid="tweetText"], [lang]');
      if (textElement) {
        data.text = textElement.textContent || textElement.innerText || '';
      }

      // Get username
      const usernameElement = tweetElement.querySelector('[data-testid="User-Name"] a[href*="/"]');
      if (usernameElement) {
        const href = usernameElement.getAttribute('href');
        if (href) {
          data.username = href.replace('/', '').split('/')[0];
        }
      }

      // Check if retweet
      data.isRetweet = tweetElement.querySelector('[data-testid="socialContext"]') !== null;

      // Check if has media
      data.hasMedia = tweetElement.querySelector('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]') !== null;

    } catch (error) {
      console.error('Error extracting tweet data:', error);
    }

    return data;
  }

  // Block/filter a tweet
  async function blockTweet(tweetElement, category, reason) {
    try {
      console.log('🚫 xModerator: Blocking tweet:', { category, reason });
      
      // Update statistics
      await storageManager.updateStats(category);
      
      // Apply visual filter
      if (settings.blurInsteadOfHide) {
        blurTweet(tweetElement, reason);
      } else {
        hideTweet(tweetElement, reason);
      }

      // Add block button
      addBlockUserButton(tweetElement);

    } catch (error) {
      console.error('Error blocking tweet:', error);
    }
  }

  // Hide tweet with overlay
  function hideTweet(tweetElement, reason) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'xmoderator-blocked-overlay';
    overlay.innerHTML = `
      <div class="xmoderator-blocked-content">
        <div class="xmoderator-blocked-icon">🛡️</div>
        <div class="xmoderator-blocked-text">Content Filtered - ${reason}</div>
        <button class="xmoderator-show-anyway" onclick="this.parentElement.parentElement.style.display='none'; this.parentElement.parentElement.nextSibling.style.display='block';">Show anyway</button>
      </div>
    `;

    // Hide original tweet
    tweetElement.style.display = 'none';

    // Insert overlay before tweet
    tweetElement.parentNode.insertBefore(overlay, tweetElement);
  }

  // Blur tweet with overlay
  function blurTweet(tweetElement, reason) {
    tweetElement.style.filter = 'blur(5px)';
    tweetElement.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.className = 'xmoderator-blur-overlay';
    overlay.innerHTML = `
      <div class="xmoderator-blur-content">
        <div class="xmoderator-blur-text">🛡️ Content Filtered - ${reason}</div>
        <button class="xmoderator-show-anyway" onclick="this.parentElement.parentElement.remove(); this.parentElement.parentElement.previousSibling.style.filter='none';">Show anyway</button>
      </div>
    `;

    tweetElement.parentNode.insertBefore(overlay, tweetElement.nextSibling);
  }

  // Add block user button
  function addBlockUserButton(tweetElement) {
    const userData = extractTweetData(tweetElement);
    if (!userData.username) return;

    const blockButton = document.createElement('button');
    blockButton.className = 'xmoderator-block-user';
    blockButton.textContent = `Block @${userData.username}`;
    blockButton.onclick = async () => {
      await storageManager.addBlockedUser(userData.username);
      console.log('🚫 xModerator: User blocked:', userData.username);
      blockButton.textContent = 'Blocked ✓';
      blockButton.disabled = true;
    };

    // Add to tweet actions area
    const actionsArea = tweetElement.querySelector('[role="group"], [data-testid="reply"]')?.parentElement;
    if (actionsArea) {
      actionsArea.appendChild(blockButton);
    }
  }

  // Show all tweets (when disabled)
  function showAllTweets() {
    document.querySelectorAll('.xmoderator-blocked-overlay, .xmoderator-blur-overlay').forEach(el => el.remove());
    document.querySelectorAll('[data-testid="tweet"]').forEach(tweet => {
      tweet.style.display = '';
      tweet.style.filter = '';
    });
  }

  // Add blocked counter to page
  function addBlockedCounter() {
    const counter = document.createElement('div');
    counter.id = 'xmoderator-counter';
    counter.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(29, 155, 240, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
      backdrop-filter: blur(10px);
    `;
    counter.textContent = `🛡️ ${stats.blockedToday || 0} filtered today`;
    document.body.appendChild(counter);
  }

  // Show extension status notification
  function showExtensionStatus() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1d9bf0;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: TwitterChirp, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: opacity 0.3s;
    `;
    notification.innerHTML = '🛡️ xModerator Active';
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Listen for messages from popup/options
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'toggle':
        isEnabled = message.enabled;
        if (isEnabled) {
          startContentMonitoring();
        } else {
          stopContentMonitoring();
          showAllTweets();
        }
        sendResponse({ success: true });
        break;
      case 'rescan':
        if (isEnabled) {
          scanExistingTweets();
        }
        sendResponse({ success: true });
        break;
    }
  });

  // Initialize when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize when navigating (SPA behavior)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('🔄 xModerator: Page navigation detected, reinitializing...');
      setTimeout(init, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();