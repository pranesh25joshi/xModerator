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
      
      // Check Arc Browser compatibility
      if (window.arcCompat && !window.arcCompat.checkArcCompatibility()) {
        console.warn('⚠️ Arc Browser compatibility issues detected');
      }
      
      // Create utility instances
      storageManager = new StorageManager();
      contentDetector = new ContentDetector();

      // Load keyword preferences first
      await contentDetector.loadKeywordPreferences();

      // Load settings and stats
      settings = await storageManager.getSettings();
      stats = await storageManager.getStats();
      isEnabled = settings.enabled;

      console.log('🛡️ xModerator initialized successfully!', { isEnabled, settings });

      // Inject CSS styles
      injectCSS();

      // Show a brief notification that extension is active
      showExtensionStatus();

      // TEST: Verify content detection is working
      console.log('🧪 xModerator: Testing content detection...');
      if (contentDetector && typeof contentDetector.analyzeContent === 'function') {
        const testResult = contentDetector.analyzeContent("wished i was an adult.", "testuser", "medium");
        console.log('🧪 xModerator: Test analysis result for "wished i was an adult.":', testResult);
        
        if (testResult.shouldBlock) {
          console.log('✅ xModerator: Content detector is working - would block adult content!');
        } else {
          console.log('❌ xModerator: Content detector NOT working - should have detected adult content!');
        }
      } else {
        console.log('❌ xModerator: Content detector not available!');
      }

      // Start monitoring
      if (isEnabled) {
        startContentMonitoring();
        addBlockedCounter();
        
        // Scan existing content immediately after setup
        console.log('🔍 xModerator: Scanning existing content on page...');
        setTimeout(() => {
          scanExistingTweets();
        }, 2000); // Give page 2 seconds to fully load
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
            // Check multiple possible tweet selectors
            const tweetSelectors = [
              '[data-testid="tweet"]',
              'article[data-testid="tweet"]', 
              'article',
              '[role="article"]'
            ];
            
            let foundTweets = [];
            
            tweetSelectors.forEach(selector => {
              if (node.matches && node.matches(selector)) {
                foundTweets.push(node);
              }
              const childTweets = node.querySelectorAll ? node.querySelectorAll(selector) : [];
              foundTweets.push(...childTweets);
            });
            
            if (foundTweets.length > 0) {
              console.log(`🐦 xModerator: Found ${foundTweets.length} new tweets, processing...`);
              foundTweets.forEach(tweet => {
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

  // Inject CSS styles for blocking overlays
  function injectCSS() {
    if (document.getElementById('xmoderator-styles')) return; // Already injected
    
    const style = document.createElement('style');
    style.id = 'xmoderator-styles';
    style.textContent = `
      /* Hide overlay styles - No longer used for hide mode */
      .xmoderator-blocked-overlay {
        display: none; /* Hidden since we don't show overlays for hide mode */
      }
      
      /* Blur overlay styles - Dark theme for Twitter */
      .xmoderator-blur-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(21, 32, 43, 0.95); /* Dark Twitter background */
        border: 1px solid rgba(113, 118, 123, 0.3); /* Gray border */
        border-radius: 12px;
        padding: 16px 24px;
        z-index: 1001;
        backdrop-filter: blur(2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      }
      
      .xmoderator-blur-content {
        text-align: center;
        color: #e7e9ea; /* Twitter light text color */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .xmoderator-blur-text {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #71767b; /* Twitter gray text */
      }
      
      .xmoderator-show-anyway {
        background: rgba(113, 118, 123, 0.2); /* Dark gray background */
        border: 1px solid rgba(113, 118, 123, 0.4);
        color: #e7e9ea; /* Light text */
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .xmoderator-show-anyway:hover {
        background: rgba(113, 118, 123, 0.3);
        border-color: rgba(113, 118, 123, 0.6);
        transform: translateY(-1px);
      }
      
      /* Block user button - Dark theme */
      .xmoderator-block-user {
        background: rgba(113, 118, 123, 0.8); /* Dark gray background */
        color: #e7e9ea; /* Light text */
        border: 1px solid rgba(113, 118, 123, 0.4);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        margin: 5px;
        transition: all 0.2s;
      }
      
      .xmoderator-block-user:hover {
        background: rgba(113, 118, 123, 1);
        border-color: rgba(113, 118, 123, 0.6);
      }
      
      .xmoderator-block-user:disabled {
        background: rgba(29, 155, 240, 0.8); /* Twitter blue when blocked */
        border-color: rgba(29, 155, 240, 0.4);
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(style);
    console.log('✅ xModerator: CSS styles injected');
  }
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
    
    // Focus on the correct X.com selector based on real HTML
    const tweetSelector = 'article[data-testid="tweet"]';
    const tweets = document.querySelectorAll(tweetSelector);
    
    console.log(`🔍 xModerator: Found ${tweets.length} tweets with selector: ${tweetSelector}`);
    console.log('🔍 xModerator: Current URL:', window.location.href);
    
    // Debug: Log the page structure
    console.log('🔍 xModerator: Page structure analysis:');
    console.log('- Total articles:', document.querySelectorAll('article').length);
    console.log('- Articles with data-testid="tweet":', tweets.length);
    console.log('- Elements with data-testid="tweetText":', document.querySelectorAll('[data-testid="tweetText"]').length);
    
    if (tweets.length === 0) {
      console.log('❌ xModerator: No tweets found with any selector!');
      console.log('� xModerator: Trying to find any content elements...');
      
      // Log first few elements that might be tweets
      const allArticles = document.querySelectorAll('article, [role="article"], div[data-testid]');
      console.log(`🔍 Found ${allArticles.length} potential tweet elements`);
      allArticles.forEach((el, i) => {
        if (i < 5) { // Log first 5
          console.log(`Element ${i}:`, {
            tag: el.tagName,
            testid: el.getAttribute('data-testid'),
            role: el.getAttribute('role'),
            classes: el.className,
            text: el.textContent?.substring(0, 100)
          });
        }
      });
    } else {
      console.log(`📊 xModerator: Found ${tweets.length} tweets to scan`);
      tweets.forEach(tweet => processTweet(tweet));
    }
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
        text: tweetData.text.substring(0, 100) + '...',
        fullText: tweetData.text
      });

      // Quick test for adult keyword (from your HTML example)
      if (tweetData.text.toLowerCase().includes('adult')) {
        console.log('🔍 xModerator: ⚠️  FOUND "adult" keyword in tweet text!');
      }

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
      console.log('🔍 xModerator: Extracting data from tweet element:', tweetElement);
      
      // Try multiple selectors for tweet text (X.com keeps changing these)
      const textSelectors = [
        '[data-testid="tweetText"]',
        '[lang]',
        '.css-901oao',
        'span[data-testid="tweetText"]',
        'div[lang]',
        '.r-37j5jr', // Common X.com text class
        'span[dir="auto"]'
      ];
      
      let textElement = null;
      for (const selector of textSelectors) {
        textElement = tweetElement.querySelector(selector);
        if (textElement && textElement.textContent?.trim()) {
          data.text = textElement.textContent || textElement.innerText || '';
          console.log(`✅ Found text using selector: ${selector} -> "${data.text}"`);
          break;
        } else {
          console.log(`❌ Selector "${selector}" found no text content`);
        }
      }
      
      // If no specific selector worked, try to get any text content
      if (!data.text && tweetElement.textContent) {
        data.text = tweetElement.textContent;
        console.log('✅ Using fallback text extraction:', data.text.substring(0, 100));
      }

      // Try multiple selectors for username
      const usernameSelectors = [
        'a[href^="/"][role="link"]',
        '[data-testid="User-Name"] a[href*="/"]',
        'a[href^="/"]'
      ];
      
      let usernameElement = null;
      for (const selector of usernameSelectors) {
        const elements = tweetElement.querySelectorAll(selector);
        console.log(`🔍 Username selector "${selector}" found ${elements.length} elements`);
        
        for (const element of elements) {
          const href = element.getAttribute('href');
          if (href && href.startsWith('/') && href.length > 1 && !href.includes('/status/')) {
            data.username = href.replace('/', '').split('/')[0];
            console.log(`✅ Found username using selector: ${selector} -> ${data.username}`);
            usernameElement = element;
            break;
          }
        }
        
        if (usernameElement) break;
      }

      // Check if retweet
      data.isRetweet = tweetElement.querySelector('[data-testid="socialContext"]') !== null;

      // Check if has media
      data.hasMedia = tweetElement.querySelector('[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img, video') !== null;

      console.log('📝 Final extracted tweet data:', {
        textLength: data.text.length,
        textPreview: data.text.substring(0, 50) + '...',
        username: data.username,
        isRetweet: data.isRetweet,
        hasMedia: data.hasMedia
      });

    } catch (error) {
      console.error('❌ Error extracting tweet data:', error);
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

  // Hide tweet completely (no overlay)
  function hideTweet(tweetElement, reason) {
    // Simply hide the tweet completely without any overlay
    tweetElement.style.display = 'none';
    console.log('🚫 xModerator: Tweet hidden completely -', reason);
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
        <button class="xmoderator-show-anyway">Show anyway</button>
      </div>
    `;

    // Add event listener for show button
    const showButton = overlay.querySelector('.xmoderator-show-anyway');
    showButton.addEventListener('click', () => {
      overlay.remove();
      tweetElement.style.filter = 'none';
    });

    tweetElement.parentNode.insertBefore(overlay, tweetElement.nextSibling);
  }

  // Add block user button
  function addBlockUserButton(tweetElement) {
    const userData = extractTweetData(tweetElement);
    if (!userData.username) return;

    const blockButton = document.createElement('button');
    blockButton.className = 'xmoderator-block-user';
    blockButton.textContent = `Block @${userData.username}`;
    
    // Add event listener instead of onclick
    blockButton.addEventListener('click', async () => {
      await storageManager.addBlockedUser(userData.username);
      console.log('🚫 xModerator: User blocked:', userData.username);
      blockButton.textContent = 'Blocked ✓';
      blockButton.disabled = true;
    });

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
      case 'reloadKeywordPreferences':
        // Reload keyword preferences when user changes them in options
        contentDetector.loadKeywordPreferences().then(() => {
          console.log('🔄 xModerator: Keyword preferences reloaded');
          if (isEnabled) {
            scanExistingTweets(); // Re-scan with new preferences
          }
        });
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

  // Expose functions for Arc Browser integration
  window.xModeratorRescan = () => {
    if (isEnabled) {
      console.log('🔄 Arc Browser triggered rescan');
      scanExistingTweets();
    }
  };

  window.xModeratorUpdateSettings = (newSettings) => {
    console.log('🌈 Arc Browser updating settings', newSettings);
    settings = { ...settings, ...newSettings };
    if (isEnabled) {
      scanExistingTweets();
    }
  };

})();