# Security Policy

## Supported Versions

Only the latest version deployed from the `main` branch is supported with security updates.

## Reporting a Vulnerability

Please report security vulnerabilities through [GitHub's private vulnerability reporting](https://github.com/samjohnduke/sudoku/security/advisories/new).

**Do not** open a public issue for security vulnerabilities.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect

- Acknowledgment within 72 hours
- Status updates as the issue is investigated
- Credit in the fix commit (unless you prefer to remain anonymous)

## Scope

### In scope

- Authentication and session handling
- API endpoints and data access
- Client-side data exposure
- Cross-site scripting (XSS) or injection vulnerabilities

### Out of scope

- Vulnerabilities in third-party dependencies (report these upstream; Dependabot monitors for known CVEs)
- Denial of service attacks
- Issues requiring physical access to a user's device

## Disclosure

This is a personal project and does not offer a bug bounty. Vulnerabilities will be patched and disclosed after a fix is deployed.
