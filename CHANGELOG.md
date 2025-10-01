# Changelog

All notable changes to xModerator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nothing yet

### Changed
- Nothing yet

### Fixed
- Nothing yet

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