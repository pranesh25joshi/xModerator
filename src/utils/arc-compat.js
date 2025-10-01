// Arc Browser compatibility utilities
// Handles Arc-specific features and optimizations

class ArcCompatibility {
  constructor() {
    this.isArc = this.detectArcBrowser();
    this.hasSpaces = this.isArc && this.detectSpacesFeature();
    
    if (this.isArc) {
      console.log('🌈 xModerator: Arc Browser detected, enabling optimizations');
      this.initArcOptimizations();
    }
  }

  // Detect if running in Arc Browser
  detectArcBrowser() {
    // Arc Browser has specific user agent patterns and window features
    const userAgent = navigator.userAgent;
    const isArcUA = userAgent.includes('Arc/') || userAgent.includes('ArcBrowser');
    
    // Arc also has specific window features
    const hasArcFeatures = typeof window.arc !== 'undefined' || 
                          document.querySelector('[data-arc-space]') !== null ||
                          window.location.href.includes('arc://');
    
    return isArcUA || hasArcFeatures;
  }

  // Detect Arc Spaces feature
  detectSpacesFeature() {
    return document.querySelector('[data-arc-space]') !== null ||
           document.body.classList.contains('arc-space') ||
           window.location.search.includes('arc-space');
  }

  // Initialize Arc-specific optimizations
  initArcOptimizations() {
    // Optimize for Arc's sidebar integration
    this.optimizeForArcSidebar();
    
    // Handle Arc's unique tab management
    this.handleArcTabManagement();
    
    // Optimize CSS for Arc's themes
    this.optimizeForArcThemes();
    
    // Handle Arc Spaces if available
    if (this.hasSpaces) {
      this.handleArcSpaces();
    }
  }

  // Optimize for Arc's sidebar integration
  optimizeForArcSidebar() {
    // Arc's sidebar can interfere with extension overlays
    // Adjust positioning to account for Arc's UI
    const style = document.createElement('style');
    style.textContent = `
      .xmoderator-overlay {
        /* Adjust for Arc's sidebar */
        margin-left: var(--arc-sidebar-width, 0px) !important;
        max-width: calc(100vw - var(--arc-sidebar-width, 0px)) !important;
      }
      
      .xmoderator-popup {
        /* Ensure popups don't get cut off by Arc's UI */
        z-index: 999999 !important;
        position: fixed !important;
      }
      
      /* Arc-specific theme compatibility */
      @media (prefers-color-scheme: dark) {
        .xmoderator-overlay {
          background: rgba(28, 28, 30, 0.95) !important;
          border-color: rgba(99, 99, 102, 0.3) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Handle Arc's unique tab management
  handleArcTabManagement() {
    // Arc has unique tab behavior, ensure our extension works properly
    // Listen for Arc-specific tab events
    if (typeof window.arc !== 'undefined' && window.arc.tab) {
      window.arc.tab.addEventListener('change', () => {
        console.log('🌈 Arc tab change detected, refreshing content detection');
        // Trigger a rescan after tab changes
        setTimeout(() => {
          if (window.xModeratorRescan) {
            window.xModeratorRescan();
          }
        }, 500);
      });
    }
  }

  // Optimize for Arc's dynamic themes
  optimizeForArcThemes() {
    // Arc supports dynamic theming, adjust our overlays accordingly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-arc-theme' || 
             mutation.attributeName === 'class')) {
          this.updateThemeCompatibility();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-arc-theme', 'class']
    });
  }

  // Update theme compatibility based on Arc's current theme
  updateThemeCompatibility() {
    const isDark = document.documentElement.classList.contains('arc-dark') ||
                   document.documentElement.getAttribute('data-arc-theme') === 'dark' ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Update CSS custom properties for Arc theme compatibility
    document.documentElement.style.setProperty(
      '--xmoderator-overlay-bg', 
      isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'
    );
    
    document.documentElement.style.setProperty(
      '--xmoderator-text-color', 
      isDark ? '#ffffff' : '#000000'
    );

    document.documentElement.style.setProperty(
      '--xmoderator-border-color', 
      isDark ? 'rgba(99, 99, 102, 0.3)' : 'rgba(0, 0, 0, 0.1)'
    );
  }

  // Handle Arc Spaces feature
  handleArcSpaces() {
    console.log('🌈 Arc Spaces detected, enabling space-aware filtering');
    
    // Arc Spaces allow different contexts - we can customize filtering per space
    const currentSpace = this.getCurrentArcSpace();
    if (currentSpace) {
      // Load space-specific settings if available
      this.loadSpaceSpecificSettings(currentSpace);
    }
  }

  // Get current Arc Space
  getCurrentArcSpace() {
    const spaceElement = document.querySelector('[data-arc-space]');
    if (spaceElement) {
      return spaceElement.getAttribute('data-arc-space');
    }
    
    // Alternative detection methods
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('arc-space') || 'default';
  }

  // Load space-specific settings
  async loadSpaceSpecificSettings(spaceName) {
    try {
      // Try to load space-specific preferences
      const result = await chrome.storage.local.get([`arcSpace_${spaceName}_settings`]);
      const spaceSettings = result[`arcSpace_${spaceName}_settings`];
      
      if (spaceSettings) {
        console.log(`🌈 Loaded settings for Arc Space: ${spaceName}`, spaceSettings);
        // Apply space-specific settings
        this.applySpaceSettings(spaceSettings);
      }
    } catch (error) {
      console.log('Could not load space-specific settings:', error);
    }
  }

  // Apply space-specific settings
  applySpaceSettings(settings) {
    // This could allow different filtering rules per Arc Space
    // For example: Work space = strict filtering, Personal space = relaxed
    if (window.xModeratorUpdateSettings) {
      window.xModeratorUpdateSettings(settings);
    }
  }

  // Check if extension is compatible with current Arc version
  checkArcCompatibility() {
    if (!this.isArc) return true;
    
    try {
      // Basic compatibility checks
      const hasRequiredAPIs = typeof chrome !== 'undefined' && 
                             chrome.storage && 
                             chrome.runtime;
      
      if (!hasRequiredAPIs) {
        console.warn('⚠️ Some Chrome APIs not available in this Arc version');
        return false;
      }
      
      console.log('✅ Arc Browser compatibility verified');
      return true;
    } catch (error) {
      console.error('❌ Arc compatibility check failed:', error);
      return false;
    }
  }
}

// Initialize Arc compatibility
let arcCompat = null;
if (typeof window !== 'undefined') {
  arcCompat = new ArcCompatibility();
  window.arcCompat = arcCompat;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArcCompatibility;
} else {
  window.ArcCompatibility = ArcCompatibility;
}