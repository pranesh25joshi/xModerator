# Changelog

All notable changes to xModerator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Firefox browser support
- Safari browser support (macOS)
- Chrome Web Store publication
- Advanced filtering rules engine

## [1.1.1] - 2025-10-02

### Changed
- 🎯 **Default Categories Refined**: Only Politics, Violence, and Adult Content enabled by default
- 📝 **Keyword Lists Optimized**: Shortened detection word lists to reduce false positives
- ⚙️ **User Choice**: Spam, Negativity, and Promotions are now optional categories users can enable

### Improved
- Reduced false positive content blocking
- More focused default filtering experience
- Better precision in content detection

## [1.1.0] - 2025-10-01

### Changed
- 🎯 **Default Behavior Update**: Blur with reveal option is now the default instead of hiding content completely
- 📖 **Documentation**: Updated all guides to reflect new blur-first approach
- 🎨 **User Experience**: New users will see filtered content as blurred rather than hidden, providing better content discovery

### Improved
- Better user experience for first-time installations
- More intuitive content filtering approach

## [1.0.9] - 2025-10-01

### Added
- 🌈 **Arc Browser Support** with enhanced optimizations
  - Sidebar integration and positioning adjustments
  - Automatic theme synchronization (light/dark)
  - Arc Spaces awareness for potential per-space settings
  - Performance optimizations for Arc's architecture
  - Dedicated [Arc Installation Guide](ARC_INSTALLATION.md)
- 🎯 **Individual Keyword Customization** - NEW MAJOR FEATURE
  - Control over all 164 detection words across 6 categories
  - Enable/disable specific keywords with checkbox interface
  - Category-level bulk actions (enable/disable all in category)
  - Real-time updates across all browser tabs
  - Complete word count visibility (Politics: 39, Violence: 35, Adult: 47, etc.)
- 🔧 **Enhanced Browser Compatibility**
  - Microsoft Edge full support
  - Opera browser full support
  - Universal extension compatibility layer
  - Browser-specific optimizations
- 📚 **Comprehensive Documentation Updates**
  - Browser-specific installation guides
  - Updated user guide with new features
  - Arc Browser specific troubleshooting
  - Enhanced README with multi-browser support table

### Changed
- **Expanded keyword lists** for better detection coverage
  - Politics: 39 words (was ~20)
  - Violence: 35 words (was ~20) 
  - Adult Content: 47 words (was ~15)
  - Spam: 14 words (maintained)
  - Negativity: 17 words (maintained)
  - Promotions: 12 words (maintained)
- **Improved UI/UX** 
  - Dark theme compatible overlays for blur mode
  - Better contrast and readability
  - Arc-specific styling integration
- **Enhanced manifest** with broader browser support declarations
- **Performance optimizations** for multi-browser compatibility

### Fixed
- Remove button functionality for custom keywords and blocked users
- Event handling improvements (replaced onclick with addEventListener)
- Global scope accessibility for options manager
- Content Security Policy compliance across browsers
- Improved error handling for storage operations

### Technical Details
- Added Arc Browser compatibility layer (`arc-compat.js`)
- Universal browser API wrapper for cross-browser functionality
- Enhanced CSS with browser-specific optimizations
- Improved storage management with better error handling
- Added tabs permission for enhanced cross-tab communication

### Browser Support
- ✅ Chrome 88+ (Full Support)
- ✅ Arc Browser 1.0+ (Enhanced Support)
- ✅ Microsoft Edge 88+ (Full Support)
- ✅ Opera 74+ (Full Support)
- 🚧 Firefox (In Development)
- 🚧 Safari (Planned)

## [1.0.8] - 2025-10-01

### Fixed
- Remove button functionality for keywords and blocked users
- Event listener improvements for better reliability
- Global scope accessibility for options manager

## [1.0.7] - 2025-10-01

### Added
- Initial keyword preference customization system
- Storage management for user keyword preferences
- UI infrastructure for keyword customization

## [1.0.6] - 2025-10-01

### Fixed
- Content Security Policy violations
- Event handler compliance
- Dark theme styling improvements

## [1.0.0] - 2024-10-01

### Added
- Initial release of xModerator
- Smart content filtering with 6 categories (Politics, Violence, Adult, Spam, Negativity, Promotions)
- Custom keyword filtering
- User blocking functionality
- Adjustable sensitivity levels (Low, Medium, High)
- Two blocking methods (Hide completely, Blur with reveal)
- Real-time blocked content counter
- Comprehensive settings page with import/export
- Statistics dashboard with category breakdowns
- Dark mode support
- Mobile-responsive design
- Privacy-focused local-only data storage
- Support for both twitter.com and x.com
- Professional popup interface
- Background service worker for cross-tab functionality
- Extensive documentation and troubleshooting guides

### Technical Details
- Manifest V3 compliance
- Vanilla JavaScript (no external dependencies)
- MutationObserver for real-time content detection
- Chrome Storage API integration
- CSS Grid/Flexbox modern layouts
- Accessibility features (ARIA labels, semantic HTML)
- Performance optimizations (smart caching, efficient DOM operations)

### Browser Support
- Chrome 88+
- Brave Browser
- Microsoft Edge (Chromium-based)

---

## Release Notes Format

### Version Types
- **Major (x.0.0)**: Breaking changes, major new features
- **Minor (1.x.0)**: New features, backwards compatible
- **Patch (1.0.x)**: Bug fixes, small improvements

### Change Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

### Future Releases

#### Planned for v1.1.0
- Whitelist mode (only show trusted sources)
- Time-based filtering (work hours blocking)
- Regex pattern support for advanced users
- Community filter sharing
- Performance improvements

#### Planned for v1.2.0
- Firefox support (Manifest V2 adaptation)
- Multi-language support
- Advanced machine learning detection
- Export blocked content list
- Integration with other social platforms

#### Long-term Roadmap
- Chrome Web Store publication
- Advanced analytics dashboard
- Real-time threat intelligence
- Team/organization features
- Mobile browser support