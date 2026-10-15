# Runstead — Development Workflow & Engineering Standards

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: Authoritative Contributor Guide

---

## 1. Prerequisites & Environment Setup

Runstead requires a modern Node.js runtime and standard Linux/macOS build tools:

| Tool | Version Requirement | Verified Baseline | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.17.0` (LTS 20.x recommended) | Node v20 / v22 on Linux x86_64 | JavaScript runtime |
| **npm** | `>= 9.0.0` (v10+ recommended) | npm 10.x | Package manager & lockfile engine |
| **Git** | `>= 2.30.0` | Git 2.43+ | Version control |
| **Chromium** | Modern headless binary | `/usr/sbin/chromium` | Playwright end-to-end testing |

---

## 2. Step-by-Step Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/eshanized/Runstead.git
cd Runstead
```

### Step 2: Install Dependencies
Always use `npm ci` rather than `npm install` to enforce clean installation matching `package-lock.json`:
```bash
npm ci
```

### Step 3: Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env.local
```
*Note: For local demonstration and offline testing, default values in `.env.example` are pre-configured to work out of the box without requiring external API keys.*

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Engineering Quality Checks & Reproducible Scripts

Runstead provides a standardized suite of verification scripts defined in [`package.json`](file:///package.json#L5-L14):

```bash
# 1. Fast Composite Validation (Recommended before commit / push)
# Executes strict typecheck, ESLint, and all 52 unit/workflow tests:
npm run check

# 2. Strict Static Type Checking (tsc --noEmit)
npm run typecheck

# 3. Code Linting (next lint)
npm run lint

# 4. Unit & Workflow Test Suites (Node.js test runner)
npm test

# 5. Production Next.js Build (Static page generation & server compilation)
npm run build

# 6. Playwright End-to-End Suite (Headless Chromium browser journeys)
npm run test:e2e

# 7. Full Pre-Release Pipeline Validation (Typecheck + Lint + Test + Build)
npm run validate
```

---

## 4. Continuous Integration Pipeline (GitHub Actions)

All commits and pull requests against `master` and `main` trigger the automated CI workflow defined in [`.github/workflows/ci.yml`](file:///file:///.github/workflows/ci.yml):

```yaml
name: Runstead CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-and-build:
    name: Test, Lint & Production Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Typecheck
        run: npm run typecheck
      - name: Lint
        run: npm run lint
      - name: Run unit test suite
        run: npm test
      - name: Production build
        run: npm run build
```

---

## 5. Repository Hygiene & Contributor Standards

### 5.1 Branch & Commit Message Conventions
Commits must follow the **Conventional Commits** specification:
- `feat(scope)`: New user-facing or architectural capability.
- `fix(scope)`: Bugfix or regression resolution.
- `docs(scope)`: Documentation, specifications, or guides.
- `test(scope)`: Automated unit, integration, or E2E test suites.
- `refactor(scope)`: Internal structural improvements without behavior changes.
- `ci(scope)`: GitHub Actions workflows, CI scripts, or issue templates.
- `chore(scope)`: Maintenance, assets, or configuration updates.

### 5.2 Pull Request Guidelines
1. Pull requests must branch from the latest `master`.
2. All 52 unit tests and 25 Playwright tests must pass with 0 failures.
3. Every pull request must link to an associated requirement ID (`FR-*` or `NFR-*`) and roadmap phase.
4. No PR may merge with unresolved critical dependency advisories or unhandled console errors.
