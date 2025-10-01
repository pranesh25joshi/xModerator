# Contributing to xModerator 🛡️

Thank you for your interest in contributing to xModerator! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@xmoderator.com](mailto:conduct@xmoderator.com).

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment of any kind
- Discriminatory language or actions
- Personal attacks or insults
- Spam or excessive self-promotion
- Any other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Types of Contributions

We welcome many types of contributions:

- 🐛 **Bug fixes** - Help us squash those pesky bugs
- ✨ **New features** - Add functionality that users will love
- 📚 **Documentation** - Improve our guides and examples
- 🎨 **UI/UX improvements** - Make the extension more beautiful and usable
- 🌍 **Translations** - Help make xModerator accessible worldwide
- ⚡ **Performance** - Optimize code for better performance
- 🔒 **Security** - Help keep our users safe

### Before You Start

1. **Check existing issues** - See if your idea/bug is already being worked on
2. **Create an issue** - Discuss your contribution before starting work
3. **Get feedback** - Make sure your approach aligns with project goals

## 🛠️ Development Setup

### Prerequisites

- **Git** - Version control
- **Chromium Browser** - Chrome, Arc, Edge, Opera, or Brave for testing
- **Code Editor** - VS Code recommended with extensions:
  - ESLint
  - Prettier
  - Chrome Extension Developer Tools

### Setup Instructions

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/xmoderator.git
   cd xmoderator
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/pranesh25joshi/xmoderator.git
   ```

4. **Load extension in browser**
   - **Chrome**: Go to `chrome://extensions/`
   - **Arc**: Go to `arc://extensions/`
   - **Edge**: Go to `edge://extensions/`
   - **Opera**: Go to `opera://extensions/`
   - **Brave**: Go to `brave://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder
   - The extension should now be loaded for testing

5. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

## 🤝 How to Contribute

### Reporting Bugs

1. **Check if the bug exists** - Search existing issues first
2. **Create a detailed bug report** - Use our bug report template
3. **Include reproduction steps** - Help us understand the problem
4. **Add screenshots/logs** - Visual evidence helps a lot

### Suggesting Features

1. **Check existing feature requests** - Avoid duplicates
2. **Create a detailed feature request** - Use our template
3. **Explain the use case** - Why is this feature needed?
4. **Consider implementation** - How might this work?

### Code Contributions

1. **Choose an issue** - Pick something you're interested in
2. **Comment on the issue** - Let others know you're working on it
3. **Follow our coding standards** - Keep code consistent
4. **Write tests** - Ensure your code works correctly
5. **Update documentation** - Keep docs in sync with changes

## 🔄 Pull Request Process

### Before Submitting

- [ ] Your code follows our style guidelines
- [ ] You've tested your changes thoroughly
- [ ] You've updated relevant documentation
- [ ] Your commits follow our commit message format
- [ ] You've added yourself to contributors if this is your first contribution

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functionality change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(content): add support for custom regex patterns
fix(popup): resolve settings not saving on first install
docs(readme): update installation instructions
style(css): improve dark mode contrast ratios
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] Tested in Chrome
- [ ] Tested in Brave
- [ ] Tested on Twitter/X
- [ ] All existing tests pass

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 📝 Coding Standards

### JavaScript

- **ES6+** features preferred
- **No external dependencies** - Keep it lightweight
- **JSDoc comments** for functions
- **Descriptive variable names**
- **Error handling** for all async operations

```javascript
/**
 * Analyzes tweet content for unwanted material
 * @param {string} content - The tweet text to analyze
 * @param {Object} settings - User filtering preferences
 * @returns {Object} Analysis results with blocking recommendation
 */
async function analyzeContent(content, settings) {
  try {
    // Implementation here
  } catch (error) {
    console.error('Content analysis failed:', error);
    return { shouldBlock: false, error: error.message };
  }
}
```

### CSS

- **Modern CSS3** features
- **CSS Grid/Flexbox** for layout
- **CSS Custom Properties** for theming
- **Mobile-first** responsive design
- **Semantic class names**

```css
.content-blocker__tweet {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-medium);
  padding: var(--spacing-small);
  border-radius: var(--border-radius);
}

@media (max-width: 768px) {
  .content-blocker__tweet {
    grid-template-columns: 1fr;
  }
}
```

### HTML

- **Semantic HTML5** elements
- **Accessibility** attributes (ARIA, alt text)
- **Proper heading hierarchy**
- **Form validation** attributes

```html
<section class="settings-section" aria-labelledby="categories-heading">
  <h2 id="categories-heading">Content Categories</h2>
  <label class="category-toggle">
    <input type="checkbox" aria-describedby="politics-desc">
    <span class="category-name">Politics</span>
    <span id="politics-desc" class="category-description">
      Political content, elections, campaigns
    </span>
  </label>
</section>
```

## 🧪 Testing Guidelines

### Manual Testing

**Required tests for all contributions:**

1. **Basic functionality**
   - Extension loads without errors
   - Settings save and load correctly
   - Content filtering works as expected

2. **Chromium browser testing**
   - Chrome (latest)
   - Arc (latest, if available)
   - Edge (latest)
   - Opera (if possible)
   - Brave (latest)

3. **Cross-platform testing**
   - Windows
   - macOS (if available)
   - Linux (if available)

### Test Scenarios

**Content Filtering:**
```
1. Visit twitter.com/x.com
2. Enable different filter categories
3. Verify appropriate content is blocked
4. Test custom keywords functionality
5. Test user blocking feature
```

**Settings Management:**
```
1. Change various settings
2. Refresh page/restart browser
3. Verify settings persist
4. Test import/export functionality
```

**Performance:**
```
1. Load extension on large Twitter feeds
2. Monitor memory usage
3. Check for console errors
4. Verify responsive behavior
```

## 📞 Community

### Getting Help

- **GitHub Discussions** - Ask questions and share ideas
- **Discord** - Real-time chat with contributors (coming soon)
- **Email** - Direct support at [support@xmoderator.com](mailto:support@xmoderator.com)

### Recognition

Contributors are recognized in several ways:

- **Contributors file** - Listed in CONTRIBUTORS.md
- **GitHub profile** - Contributions show on your GitHub profile
- **Release notes** - Major contributions mentioned in releases
- **Special badges** - Long-term contributors get special recognition

### Maintainer Responsibilities

**Project maintainers will:**
- Review pull requests within 48 hours
- Provide constructive feedback
- Help contributors improve their code
- Maintain project standards and vision
- Keep the community welcoming and inclusive

---

## 🎉 Thank You!

Every contribution, no matter how small, helps make xModerator better for everyone. Whether you're fixing a typo, adding a feature, or helping other users in discussions, your efforts are appreciated!

**Ready to contribute?** 
1. [Check out our open issues](https://github.com/pranesh25joshi/xmoderator/issues)
2. [Join our discussions](https://github.com/pranesh25joshi/xmoderator/discussions)
3. [Start your first contribution](https://github.com/pranesh25joshi/xmoderator/fork)

*Happy coding! 🚀*