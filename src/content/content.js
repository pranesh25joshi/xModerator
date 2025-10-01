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
      // Create utility instances
      storageManager = new StorageManager();
      contentDetector = new ContentDetector();

      // Load settings
      settings = await storageManager.getSettings();
      stats = await storageManager.getStats();
      isEnabled = settings.enabled;

      console.log('xModerator initialized', { isEnabled, settings });

      // Start monitoring
      if (isEnabled) {
        startContentMonitoring();
        addBlockedCounter();
      }

      // Listen for settings changes
      chrome.storage.onChanged.addListener(handleStorageChanges);

    } catch (error) {
      console.error('xModerator initialization failed:', error);
    }
  }

  // Handle storage changes (settings updates)
  function handleStorageChanges(changes, namespace) {
    if (changes.twitterBlockerSettings) {
      settings = { ...settings, ...changes.twitterBlockerSettings.newValue };
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
              
              tweets.forEach(tweet => processTweet(tweet));
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
    window.twitterBlockerObserver = observer;
  }

  // Stop content monitoring
  function stopContentMonitoring() {
    if (window.twitterBlockerObserver) {
      window.twitterBlockerObserver.disconnect();
      window.twitterBlockerObserver = null;
    }
  }

  // Scan existing tweets on page
  function scanExistingTweets() {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    tweets.forEach(tweet => processTweet(tweet));
  }

  // Process individual tweet
  async function processTweet(tweetElement) {
    if (!isEnabled || !tweetElement || tweetElement.dataset.processed === 'true') {
      return;
    }

    // Mark as processed to avoid duplicate processing
    tweetElement.dataset.processed = 'true';

    try {
      // Extract tweet content
      const tweetData = extractTweetData(tweetElement);
      
      if (!tweetData.text && !tweetData.username) {
        return; // Skip if no content to analyze
      }

      // Check if user is blocked
      if (contentDetector.isUserBlocked(tweetData.username, settings.blockedUsers)) {
        await blockTweet(tweetElement, 'users', `Blocked user: @${tweetData.username}`);
        return;
      }

      // Check custom keywords
      if (contentDetector.checkCustomKeywords(tweetData.text, settings.customKeywords)) {
        await blockTweet(tweetElement, 'keywords', 'Contains blocked keyword');
        return;
      }

      // Analyze content for unwanted categories
      const analysis = contentDetector.analyzeContent(
        tweetData.text, 
        tweetData.username, 
        settings.sensitivity
      );

      // Check if any enabled categories were detected
      const blockedCategories = analysis.categories.filter(cat => 
        settings.categories[cat.category] === true
      );

      if (analysis.shouldBlock && blockedCategories.length > 0) {
        const primaryCategory = blockedCategories[0].category;
        const reason = `${contentDetector.getCategoryDisplayName(primaryCategory)} content detected`;
        await blockTweet(tweetElement, primaryCategory, reason);
        return;
      }

      // Check for spam patterns
      const spamAnalysis = contentDetector.analyzeStructure(tweetData.text);
      if (spamAnalysis.isSpammy && settings.categories.spam) {
        await blockTweet(tweetElement, 'spam', 'Spam-like content detected');
        return;
      }

    } catch (error) {
      console.error('Error processing tweet:', error);
    }
  }

  // Extract data from tweet element
  function extractTweetData(tweetElement) {
    const data = {
      text: '',
      username: '',
      element: tweetElement
    };

    try {
      // Extract tweet text
      const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
      if (tweetTextElement) {
        data.text = tweetTextElement.textContent || '';
      }

      // Extract username
      const usernameElement = tweetElement.querySelector('[data-testid="User-Name"] a');
      if (usernameElement) {
        const href = usernameElement.getAttribute('href');
        if (href) {
          data.username = href.replace('/', '');
        }
      }

      // Also get text from quoted tweets, replies, etc.
      const additionalText = tweetElement.querySelectorAll('[lang]');
      additionalText.forEach(el => {
        if (el.textContent && !data.text.includes(el.textContent)) {
          data.text += ' ' + el.textContent;
        }
      });

    } catch (error) {
      console.error('Error extracting tweet data:', error);
    }

    return data;
  }

  // Block/hide a tweet
  async function blockTweet(tweetElement, category, reason) {
    try {
      // Update stats
      await storageManager.updateStats(category);
      stats = await storageManager.getStats();

      // Apply blocking style
      if (settings.blurInsteadOfHide) {
        tweetElement.classList.add('twitter-blocker-blurred');
        
        // Add reveal button
        const revealBtn = createRevealButton(reason);
        tweetElement.appendChild(revealBtn);
      } else {
        tweetElement.classList.add('twitter-blocker-hidden');
        
        // Add blocked message
        const blockedMsg = createBlockedMessage(reason);
        tweetElement.appendChild(blockedMsg);
      }

      // Update counter
      updateBlockedCounter();

      console.log(`Blocked tweet: ${reason}`, { category, stats: stats.blockedToday });

    } catch (error) {
      console.error('Error blocking tweet:', error);
    }
  }

  // Create reveal button for blurred tweets
  function createRevealButton(reason) {
    const button = document.createElement('div');
    button.className = 'twitter-blocker-reveal-btn';
    button.innerHTML = `
      <div class="reveal-content">
        <span class="reveal-text">Content hidden: ${reason}</span>
        <button class="reveal-button">Show anyway</button>
      </div>
    `;

    button.querySelector('.reveal-button').addEventListener('click', (e) => {
      e.stopPropagation();
      const tweetElement = button.closest('[data-testid="tweet"]');
      tweetElement.classList.remove('twitter-blocker-blurred');
      button.remove();
    });

    return button;
  }

  // Create blocked message for hidden tweets
  function createBlockedMessage(reason) {
    const message = document.createElement('div');
    message.className = 'twitter-blocker-blocked-msg';
    message.innerHTML = `
      <div class="blocked-content">
        <span class="blocked-icon">🚫</span>
        <span class="blocked-text">Tweet blocked: ${reason}</span>
        <button class="show-button">Show</button>
      </div>
    `;

    message.querySelector('.show-button').addEventListener('click', (e) => {
      e.stopPropagation();
      const tweetElement = message.closest('[data-testid="tweet"]');
      tweetElement.classList.remove('twitter-blocker-hidden');
      message.remove();
    });

    return message;
  }

  // Add blocked content counter to page
  function addBlockedCounter() {
    if (!settings.showBlockedCount) return;

    const counter = document.createElement('div');
    counter.id = 'twitter-blocker-counter';
    counter.className = 'twitter-blocker-counter';
    counter.innerHTML = `
      <div class="counter-content">
        <span class="counter-icon">🛡️</span>
        <span class="counter-text">Blocked today: <span id="counter-number">${stats.blockedToday || 0}</span></span>
      </div>
    `;

    // Add to page (try different locations)
    const targetLocations = [
      'nav[aria-label="Primary"]',
      '[data-testid="primaryColumn"]',
      'main',
      'body'
    ];

    for (const selector of targetLocations) {
      const target = document.querySelector(selector);
      if (target) {
        target.appendChild(counter);
        break;
      }
    }
  }

  // Update blocked counter
  function updateBlockedCounter() {
    const counterNumber = document.getElementById('counter-number');
    if (counterNumber) {
      counterNumber.textContent = stats.blockedToday || 0;
    }
  }

  // Show all hidden tweets (when extension is disabled)
  function showAllTweets() {
    const hiddenTweets = document.querySelectorAll('.twitter-blocker-hidden, .twitter-blocker-blurred');
    hiddenTweets.forEach(tweet => {
      tweet.classList.remove('twitter-blocker-hidden', 'twitter-blocker-blurred');
      
      // Remove blocker messages
      const blockerElements = tweet.querySelectorAll('.twitter-blocker-reveal-btn, .twitter-blocker-blocked-msg');
      blockerElements.forEach(el => el.remove());
    });

    // Remove counter
    const counter = document.getElementById('twitter-blocker-counter');
    if (counter) {
      counter.remove();
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'getStats':
        sendResponse(stats);
        break;
      case 'toggle':
        isEnabled = message.enabled;
        if (isEnabled) {
          startContentMonitoring();
          addBlockedCounter();
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
  let currentUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(init, 1000); // Delay to let new content load
    }
  }).observe(document, { subtree: true, childList: true });

})();