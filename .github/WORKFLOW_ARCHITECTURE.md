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
  - Spell checking (source files)
  - TypeScript checking and Astro build
  - Spell checking (generated HTML)
  - Internal link validation
  - Upload pages artifact for deployment

**Outputs**:
- `artifact-uploaded`: Boolean indicating if the build artifact was successfully created

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
- Provides detailed status comments on PRs
- Acts as a complete dry-run of the deployment process
- Reports all validation results clearly

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
- All linting and type checking
- Spell checking (both source and generated HTML)
- Full site build
- Link validation

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
3. The PR validation comment provides a summary of what checks ran

## Security Considerations

- Deployment requires `pages: write` and `id-token: write` permissions
- PR validation has minimal permissions (only `pull-requests: write` for comments)
- Concurrency groups prevent race conditions during deployment
- Branch protection rules should be configured to require PR validation before merge