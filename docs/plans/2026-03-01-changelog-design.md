# Automated Changelog Design

## Overview

Auto-generate `CHANGELOG.md` from conventional commits using git-cliff, triggered on push to main via GitHub Actions.

## Files

### `cliff.toml`
git-cliff config. Groups commits by type (Features, Bug Fixes, Documentation, Miscellaneous). Strips conventional commit prefixes. Skips merge commits.

### `.github/workflows/changelog.yml`
Dedicated workflow triggered on push to main. Uses `orhun/git-cliff-action` to regenerate `CHANGELOG.md` from full history. Auto-commits back to main with `[skip ci]` to prevent loops.

### `CHANGELOG.md`
Generated file committed to repo.
