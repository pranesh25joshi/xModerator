// Content detection utility for identifying unwanted content

class ContentDetector {
  constructor() {
    // Default keyword lists for different categories
    this.defaultKeywords = {
      politics: [
        'trump', 'biden', 'modi', 'election', 'democrat', 'republican',
        'congress', 'senate', 'political',
        'liberal', 'conservative', 'left wing', 'right wing', 'maga', 'gop',
        'politics', 'government', 'minister', 'parliament', 'bjp', 'leftist',
        'rightwing', 'socialist', 'assembly','mp', 'mla', 'lok sabha', 'rajya sabha'
      ],
      violence: [
        'kill', 'murder', 'death', 'dead',
        'shooting', 'weapon', 'bomb', 'explosion', 'terror', 'war',
         'blood', 'bloody', 'assault','terrorist',
        'riot', 'crime', 'stab', 'rape', 'injury', 'torture', 'hostage',
        'execute', 'lynch', 'massacre', 'genocide', 'homicide', 'suicide',
        'selfharm', 'harm', 'hurt', 'aggression', 'brutal',
        'victim', 'perpetrator'
      ],
      adult: [
        'porn', 'sex', 'nude', 'naked', 'nsfw', 'xxx', 'sexy', 'escort', 'hookup', 'hot singles', 'erotic', 'camgirl', 'boobs', 'strip', 'orgasm', 'cum',
        'dildo', 'anal', 'blowjob', 'threesome', 'incest', 'milf', 'bdsm',
        'kink', 'hardcore', 'masturbate', 'pussy', 'cock', 'penis',
        'vagina', 'clit', 'tits', 'ass', 'butt', 'dominatrix',
        'submissive', 'dominant', 'sexwork', 'sexworker', 'hooker', 'prostitute',
        'lewd', 'r18', 'r-18', 'r 18'
      ],
      spam: [
        
      ],
      negativity: [
        
      ],
      promotions: [
        'sponsored', 'ad', 'advertisement',
        'offer', 'deal', 'coupon', 'promo', 'affiliate'
      ]
    };

    // Active keywords (will be loaded from user preferences)
    this.keywords = { ...this.defaultKeywords };

    // Regex patterns for more sophisticated detection
    this.patterns = {
      urls: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
      mentions: /@[a-zA-Z0-9_]+/g,
      hashtags: /#[a-zA-Z0-9_]+/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
    };
  }

  // Load user's keyword preferences and update active keywords
  async loadKeywordPreferences() {
    try {
      const result = await chrome.storage.local.get(['keywordPreferences']);
      const preferences = result.keywordPreferences || {};
      
      // Update active keywords based on user preferences
      for (const [category, defaultWords] of Object.entries(this.defaultKeywords)) {
        const userPrefs = preferences[category] || {};
        // Only include keywords that are not explicitly disabled
        this.keywords[category] = defaultWords.filter(keyword => 
          userPrefs[keyword] !== false // Include if not explicitly set to false
        );
      }
      
      console.log('Loaded keyword preferences:', preferences);
    } catch (error) {
      console.error('Error loading keyword preferences:', error);
      // Fallback to default keywords
      this.keywords = { ...this.defaultKeywords };
    }
  }

  // Get all default keywords for UI purposes
  getDefaultKeywords() {
    return this.defaultKeywords;
  }

  // Get current active keywords
  getActiveKeywords() {
    return this.keywords;
  }

  // Main content analysis function
  analyzeContent(text, username = '', sensitivity = 'medium') {
    if (!text) return { shouldBlock: false, categories: [], confidence: 0 };

    const normalizedText = text.toLowerCase();
    const detectedCategories = [];
    let totalConfidence = 0;
    let matchCount = 0;

    // Check each category
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const result = this.checkCategory(normalizedText, keywords, sensitivity);
      if (result.matches > 0) {
        detectedCategories.push({
          category,
          matches: result.matches,
          confidence: result.confidence,
          keywords: result.foundKeywords
        });
        totalConfidence += result.confidence;
        matchCount += result.matches;
      }
    }

    // Calculate overall confidence
    const overallConfidence = matchCount > 0 ? totalConfidence / detectedCategories.length : 0;

    // Determine if content should be blocked based on sensitivity
    const threshold = this.getSensitivityThreshold(sensitivity);
    const shouldBlock = overallConfidence >= threshold;

    return {
      shouldBlock,
      categories: detectedCategories,
      confidence: overallConfidence,
      matchCount,
      analysis: {
        textLength: text.length,
        hasUrls: this.patterns.urls.test(text),
        hasMentions: this.patterns.mentions.test(text),
        hasHashtags: this.patterns.hashtags.test(text),
        username: username
      }
    };
  }

  // Check specific category keywords
  checkCategory(text, keywords, sensitivity) {
    let matches = 0;
    let confidence = 0;
    const foundKeywords = [];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        foundKeywords.push(keyword);
        
        // Higher confidence for exact matches vs partial matches
        const keywordConfidence = this.calculateKeywordConfidence(keyword, text, sensitivity);
        confidence += keywordConfidence;
      }
    }

    return {
      matches,
      confidence: matches > 0 ? confidence / matches : 0,
      foundKeywords
    };
  }

  // Calculate confidence score for keyword match
  calculateKeywordConfidence(keyword, text, sensitivity) {
    const occurrences = (text.match(new RegExp(keyword, 'g')) || []).length;
    const textLength = text.length;
    const keywordLength = keyword.length;
    
    // Base confidence - higher for explicit words
    let confidence = 40; // Increased from 30
    
    // Extra boost for explicit adult content keywords
    const explicitKeywords = ['adult', 'porn', 'sex', 'nude', 'naked', 'nsfw', 'xxx'];
    if (explicitKeywords.includes(keyword.toLowerCase())) {
      confidence += 20; // Extra boost for explicit content
    }
    
    // Boost for multiple occurrences
    confidence += (occurrences - 1) * 15;
    
    // Boost for longer keywords (more specific)
    confidence += keywordLength * 2;
    
    // Reduce confidence for very long texts (keyword might be incidental)
    if (textLength > 500) {
      confidence *= 0.8;
    }
    
    // Adjust based on sensitivity
    const sensitivityMultiplier = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.3
    };
    
    confidence *= sensitivityMultiplier[sensitivity] || 1.0;
    
    return Math.min(confidence, 100); // Cap at 100
  }

  // Get blocking threshold based on sensitivity
  getSensitivityThreshold(sensitivity) {
    const thresholds = {
      'low': 50,    // Only block very obvious content
      'medium': 30, // Balance between blocking and allowing (lowered from 45)
      'high': 15    // Block more aggressively (lowered from 25)
    };
    
    return thresholds[sensitivity] || 30;
  }

  // Check if user is in blocked list
  isUserBlocked(username, blockedUsers) {
    if (!username || !blockedUsers) return false;
    const cleanUsername = username.replace('@', '').toLowerCase();
    return blockedUsers.includes(cleanUsername);
  }

  // Check custom keywords
  checkCustomKeywords(text, customKeywords) {
    if (!customKeywords || customKeywords.length === 0) return false;
    
    const normalizedText = text.toLowerCase();
    return customKeywords.some(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
  }

  // Analyze tweet structure for spam patterns
  analyzeStructure(text) {
    const analysis = {
      isSpammy: false,
      reasons: []
    };

    // Check for excessive caps
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.7 && text.length > 10) {
      analysis.isSpammy = true;
      analysis.reasons.push('excessive_caps');
    }

    // Check for excessive punctuation
    const punctRatio = (text.match(/[!?.,]/g) || []).length / text.length;
    if (punctRatio > 0.3) {
      analysis.isSpammy = true;
      analysis.reasons.push('excessive_punctuation');
    }

    // Check for repetitive characters
    if (/(.)\1{4,}/.test(text)) {
      analysis.isSpammy = true;
      analysis.reasons.push('repetitive_characters');
    }

    // Check for multiple URLs
    const urls = text.match(this.patterns.urls) || [];
    if (urls.length > 2) {
      analysis.isSpammy = true;
      analysis.reasons.push('multiple_urls');
    }

    return analysis;
  }

  // Get human-readable category names
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
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentDetector;
} else {
  window.ContentDetector = ContentDetector;
}