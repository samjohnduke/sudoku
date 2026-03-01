# GitHub Actions CI Design

## Overview

Single GitHub Actions workflow with two jobs: `check` (CI) and `deploy` (CD).

## Triggers

- `push` to `main`
- `pull_request` to `main`

## Job 1: `check`

Runs on: `ubuntu-latest`, Node 22

Steps:
1. Checkout code
2. Setup Node 22 with npm cache
3. `npm ci` (postinstall generates `worker-configuration.d.ts` via `wrangler types`)
4. Typecheck: `npx react-router typegen && tsc -b`
5. Test: `npx vitest run`
6. Build: `npx react-router build`

## Job 2: `deploy`

Runs on: `ubuntu-latest`, Node 22
Condition: push to main only
Depends on: `check` passing

Steps:
1. Checkout code
2. Setup Node 22 with npm cache
3. `npm ci`
4. Deploy: `npx wrangler deploy` with `CLOUDFLARE_API_TOKEN` secret

## Secrets Required

- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Workers deploy permissions, added to GitHub repo settings

## File

`.github/workflows/ci.yml`
