// Content detection utility for identifying unwanted content

class ContentDetector {
  constructor() {
    // Keyword lists for different categories
    this.keywords = {
      politics: [
        'trump', 'biden', 'election', 'vote', 'voting', 'democrat', 'republican',
        'congress', 'senate', 'politician', 'political', 'campaign', 'poll',
        'liberal', 'conservative', 'left wing', 'right wing', 'maga', 'gop'
      ],
      violence: [
        'kill', 'murder', 'death', 'dead', 'violence', 'violent', 'attack',
        'shooting', 'gun', 'weapon', 'bomb', 'explosion', 'terror', 'war',
        'fight', 'fighting', 'blood', 'bloody', 'assault', 'abuse'
      ],
      adult: [
        'porn', 'sex', 'nude', 'naked', 'adult', 'nsfw', 'xxx', 'sexy',
        'onlyfans', 'escort', 'hookup', 'dating', 'hot singles'
      ],
      spam: [
        'click here', 'free money', 'make money', 'work from home', 'get rich',
        'buy now', 'limited time', 'act now', 'guarantee', 'risk free',
        'no obligation', 'call now', 'urgent', 'congratulations'
      ],
      negativity: [
        'hate', 'angry', 'furious', 'disgusting', 'terrible', 'awful',
        'worst', 'horrible', 'stupid', 'idiot', 'moron', 'pathetic',
        'losers', 'fail', 'failing', 'disappointed', 'frustrated'
      ],
      promotions: [
        'sponsored', 'ad', 'advertisement', 'promote', 'sale', 'discount',
        'offer', 'deal', 'coupon', 'promo', 'affiliate', 'partnership'
      ]
    };

    // Regex patterns for more sophisticated detection
    this.patterns = {
      urls: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
      mentions: /@[a-zA-Z0-9_]+/g,
      hashtags: /#[a-zA-Z0-9_]+/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
    };
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
    
    // Base confidence
    let confidence = 30;
    
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
      'low': 70,    // Only block very obvious content
      'medium': 45, // Balance between blocking and allowing
      'high': 25    // Block more aggressively
    };
    
    return thresholds[sensitivity] || 45;
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