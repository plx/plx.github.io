# GitHub Actions Workflow Architecture

## Overview

This repository uses a modular GitHub Actions workflow architecture to ensure consistency between PR validation and deployment while preventing accidental deployments.

## Workflow Files

### 1. `.github/workflows/build.yml` (Reusable Workflow)
**Purpose**: Core build and validation logic used by both PR validation and deployment

**Features**:
- Reusable workflow that can be called by other workflows
- Accepts optional `checkout-ref` input for specific git references
- Performs all validation steps:
  - Linting (ESLint)
  - Markdown linting
  - TypeScript checking
  - Unit tests
  - Spell checking (source files)
  - Prose linting (Vale)
  - Vale fixture tests
  - Astro check and production build
  - Spell checking (generated HTML)
  - Internal link validation
  - RSS feed validation
  - Chromium browser and accessibility QA
  - Upload pages artifact for deployment

### 2. `.github/workflows/deploy.yml`
**Purpose**: Deploy the site to GitHub Pages

**Triggers**:
- Automatic: Push to `main` branch
- Manual: `workflow_dispatch` with optional `deploy` flag

**Safety Features**:
- Only deploys from `main` branch
- Manual trigger requires explicit `deploy: true` flag
- Uses concurrency group to prevent parallel deployments
- Conditional deployment logic prevents accidental deploys

**Jobs**:
1. `build`: Calls reusable build workflow
2. `deploy`: Conditionally deploys to GitHub Pages (only if conditions are met)

### 3. `.github/workflows/pr-validation.yml`
**Purpose**: Validate pull requests before merge

**Features**:
- Uses the same build workflow as deployment (ensures parity)
- Acts as a complete dry-run of the deployment process
- Reports results through GitHub's native required check

## Key Design Decisions

### 1. Single Source of Truth
All build and validation logic lives in `build.yml`, ensuring PR validation and deployment use identical processes.

### 2. Deployment Safety
Multiple safeguards prevent accidental deployment:
- Branch restrictions (`main` only)
- Explicit flags for manual deployment
- Conditional job execution

### 3. Complete PR Validation
PRs undergo the exact same validation as deployment, including:
- ESLint, Markdown linting, and type checking
- Unit tests
- Spell checking (both source and generated HTML)
- Prose linting
- Vale fixture tests
- Full site build
- Link validation
- RSS feed validation
- Chromium browser and accessibility QA

This prevents the "passes CI but fails deployment" scenario.

## Workflow Execution Patterns

### Pattern 1: Normal Development (PR → Merge → Deploy)
1. Developer creates PR → `pr-validation.yml` runs → Full validation
2. PR approved and merged → Push to `main` triggers `deploy.yml`
3. `deploy.yml` runs build → Automatically deploys

### Pattern 2: Manual Deployment Dry-Run
1. Run `deploy.yml` manually from any branch
2. Set `deploy: false` (or leave default)
3. Build runs but deployment is skipped
4. Useful for testing workflow changes

### Pattern 3: Emergency Manual Deployment
1. Run `deploy.yml` manually from `main` branch
2. Set `deploy: true`
3. Full build and deployment executes
4. Useful if automatic deployment fails

## Maintenance Notes

### Adding New Validation Steps
Add new validation steps to `build.yml` only. They will automatically be included in both PR validation and deployment.

### Dependency Updates

Dependabot checks npm and GitHub Actions weekly via `.github/dependabot.yml`. Compatible
npm minor/patch updates and GitHub Actions updates are grouped to reduce PR
noise; npm major upgrades remain separate so their migration risk is explicit.
Action references stay pinned to full commit SHAs, with release-version comments
for reviewability.

### Modifying Deployment Conditions
Edit the `if` condition in the `deploy` job of `deploy.yml`. Current logic:
```yaml
if: |
  (github.event_name == 'push' && github.ref == 'refs/heads/main') ||
  (github.event_name == 'workflow_dispatch' && inputs.deploy == true && github.ref == 'refs/heads/main')
```

### Debugging Workflow Issues
1. Check the workflow run logs in GitHub Actions tab
2. Use `workflow_dispatch` to manually test workflows
3. Inspect the `Validate PR` required check for the failing validation step

## Security Considerations

- Deployment grants `pages: write` and `id-token: write` only to the deploy job
- Build and PR validation have only `contents: read`
- Checkout credentials are not persisted after source retrieval
- Third-party and GitHub-authored actions are pinned to audited commit SHAs
- The `configure-pages` action was removed as it's not needed (we don't use its outputs)
- Concurrency groups prevent race conditions during deployment
- Branch protection rules should be configured to require PR validation before merge

### Permission Model
- **PR Validation**: Read-only access (cannot modify the repository or deploy)
- **Build**: Read-only access, including when called by the deployment workflow
- **Deployment**: Pages/OIDC write access only in the conditional deploy job
- **Manual Workflow**: Deployment only allowed from main branch with explicit flag
