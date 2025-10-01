# Security Policy

## Supported Versions

We actively support the following versions of xModerator with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The xModerator team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**For security vulnerabilities, please DO NOT open a public GitHub issue.**

Instead, please report security vulnerabilities to: **security@xmoderator.com**

### What to Include

Please include the following information in your report:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

### Our Response Process

1. **Acknowledgment**: We'll acknowledge receipt of your report within 24 hours
2. **Investigation**: We'll investigate and verify the vulnerability
3. **Timeline**: We'll provide an estimated timeline for a fix
4. **Resolution**: We'll develop and test a fix
5. **Disclosure**: We'll coordinate public disclosure after the fix is released

### Response Timeline

- **Critical vulnerabilities**: Fixed within 48 hours
- **High severity**: Fixed within 1 week
- **Medium severity**: Fixed within 2 weeks
- **Low severity**: Fixed in next scheduled release

### Recognition

We believe in giving credit where credit is due. If you report a valid security vulnerability:

- We'll acknowledge your contribution in our security advisories
- We'll list you in our Hall of Fame (with your permission)
- For significant findings, we may offer a small token of appreciation

### Security Best Practices

When using xModerator:

- **Keep updated**: Always use the latest version
- **Review permissions**: Understand what permissions the extension needs
- **Report issues**: Report any suspicious behavior immediately
- **Safe browsing**: Use xModerator as part of a broader security strategy

### What We Protect Against

xModerator is designed to protect against:

- **Malicious content injection** through filtered tweets
- **Cross-site scripting (XSS)** attacks via content analysis
- **Data exfiltration** through local-only storage
- **Unauthorized access** to user settings and preferences

### What We Don't Cover

This security policy covers the xModerator extension only. It does not cover:

- Security issues in Twitter/X platform itself
- Browser vulnerabilities
- Operating system security
- Network-level attacks
- Physical device security

### Security Features

xModerator includes several built-in security features:

- **Content Security Policy** prevents script injection
- **Manifest V3** provides enhanced security model
- **Local storage only** - no external data transmission
- **Minimal permissions** - only necessary browser access
- **Open source** - full code transparency
- **Regular updates** - prompt security patches

### Responsible Disclosure

We follow responsible disclosure practices:

- We'll work with you to understand and fix the issue
- We won't take legal action against good-faith security research
- We'll coordinate public disclosure to protect users
- We'll provide credit for your discovery (with permission)

### Contact Information

- **Security Email**: security@xmoderator.com
- **Response Time**: Within 24 hours
- **PGP Key**: Available upon request
- **Emergency Contact**: For critical issues, contact via multiple channels

---

## Recent Security Updates

### Version 1.0.0 (Initial Release)
- Implemented Content Security Policy
- Added input sanitization for user-provided keywords
- Enabled strict permission model
- Conducted initial security audit

---

*This security policy is subject to updates. Check back regularly for the latest information.*

**Last updated**: October 1, 2024