# Security Policy

## Overview

The Inventory Analytics Suite is a client-side web application. All calculations run entirely in the browser, and no user data is transmitted to any server.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

We only provide security updates for the latest version. Users are encouraged to always use the most recent release.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

### How to Report

1. **Do not** open a public issue for security vulnerabilities
2. Email details to the repository maintainer via GitHub's private contact feature
3. Or open a [private security advisory](https://github.com/blasthappy82/Inventory_Analytics_Suite/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution**: Depends on severity and complexity

## Security Considerations

### Client-Side Architecture

This application:
- Runs entirely in the browser
- Does not collect or transmit user data
- Does not use cookies or local storage for sensitive data
- Does not require authentication

### Third-Party Dependencies

We regularly update dependencies to address known vulnerabilities. The project uses:
- React and related UI libraries
- Vite for building
- No backend services

### Deployment Security

When self-hosting:
- Serve over HTTPS
- Use appropriate Content Security Policy headers
- Keep the hosting platform updated

## Scope

### In Scope
- Cross-site scripting (XSS) vulnerabilities
- Dependency vulnerabilities
- Build process security issues
- Documentation that could lead to insecure implementations

### Out of Scope
- Vulnerabilities in user's browser or operating system
- Social engineering attacks
- Physical security issues
- Denial of service attacks on hosting platforms

## Recognition

We appreciate security researchers who help keep our project secure. Contributors who report valid vulnerabilities will be acknowledged in our release notes (unless they prefer to remain anonymous).
