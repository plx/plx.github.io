# CI/CD and Branch Protection Documentation

## Overview

This repository implements comprehensive quality gates to ensure code quality and prevent broken deployments to GitHub Pages.

## 🛡️ Protection Mechanisms

### 1. Pull Request Validation

**File:** `.github/workflows/pr-validation.yml`

All pull requests to `main` undergo automated validation:

- **Linting** - Code style and quality checks via ESLint
- **Markdown Linting** - Structural checks for Markdown and MDX content
- **Unit Tests** - Vitest coverage for TypeScript utilities
- **Spell Checking** - Source and generated HTML spelling checks via CSpell
- **Prose Linting** - Article terminology and style checks via Vale
- **Vale Fixture Tests** - Terminology rule fixtures that assert expected pass/fail behavior
- **Type Checking** - Native TypeScript checks plus `astro check`
- **Build Verification** - Ensures the site builds successfully
- **Link Validation** - Checks all internal links are valid
- **Feed Validation** - Checks RSS XML and namespace correctness
- **Browser QA** - Runs Chromium behavior, responsive, and accessibility checks

Results appear in GitHub's native `Validate PR` required check.

### 2. Link Validation

**File:** `scripts/validate-links.js`

Custom Node.js script that:
- Parses all generated HTML files in `dist/`
- Extracts internal links (href and src attributes)
- Validates each link resolves to an actual file or route
- Reports broken links with their source locations

**Usage:**
```bash
npm run validate:links      # Run link validation
npm run lint:prose          # Run Vale prose linting
npm run test:vale           # Run Vale terminology fixture tests
npm run validate:all        # Run static validation plus Chromium browser QA
```

### 3. Deployment Workflow

**File:** `.github/workflows/deploy.yml`

Automatically deploys to GitHub Pages when changes are pushed to `main`:
- Builds the site with `npm run build`
- Uploads artifacts to GitHub Pages
- Only runs after all PR checks have passed (when branch protection is enabled)
- Grants Pages and OIDC write permissions only to the deploy job

### 4. Dependency Maintenance

**File:** `.github/dependabot.yml`

Dependabot checks npm and GitHub Actions weekly. It groups compatible npm
minor/patch updates and all GitHub Actions updates while leaving npm majors as
focused migration PRs. Workflow actions remain pinned to full commit SHAs;
Dependabot updates those pins as new releases are selected.

## 🔐 Branch Protection Setup

### Required Configuration

Follow the instructions in `.github/BRANCH_PROTECTION.md` to enable branch protection.

**Key Settings:**
- Require pull request reviews before merging
- Require status checks to pass (specifically the `validate` check)
- Dismiss stale reviews when new commits are pushed
- Require branches to be up to date before merging

### Setting Up Protection

#### Via GitHub UI:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Configure settings per `BRANCH_PROTECTION.md`

#### Via GitHub CLI:
```bash
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"required_approving_review_count":1}'
```

## 📋 Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/my-feature
```

### 2. Make Changes
Edit files, add content, modify styles, etc.

### 3. Test Locally
```bash
npm run test:ci  # Run all CI checks locally
```

### 4. Create Pull Request
```bash
git push origin feature/my-feature
# Create PR via GitHub UI or CLI
```

### 5. Automated Validation
The PR validation workflow automatically runs and reports a native required check.

### 6. Merge
Once checks pass and PR is approved, merge to main.

### 7. Automatic Deployment
Changes are automatically deployed to GitHub Pages.

## 🚀 Future Enhancements

### Phase 2: Enhanced Link Validation
- [ ] External link checking with smart caching
- [ ] Anchor link validation (#fragments)
- [ ] Asset optimization checks

### Phase 3: Quality Improvements
- [x] Accessibility testing (axe-core + Playwright)
- [ ] SEO validation
- [ ] Performance budgets (Lighthouse CI)
- [x] Content validation (Astro/Zod frontmatter schemas)

### Phase 4: Advanced Features
- [ ] Preview deployments for PRs
- [ ] Visual regression testing
- [x] Spell checking
- [x] Automated dependency updates
- [ ] Security scanning

## 🛠️ Troubleshooting

### PR Checks Failing

1. **Linting Errors:**
   ```bash
   npm run lint:fix  # Auto-fix linting issues
   ```

2. **Build Errors:**
   ```bash
   npm run build  # Test build locally
   ```

3. **Link Validation Errors:**
   ```bash
   npm run validate:links  # Check which links are broken
   ```

### Branch Protection Not Working

- Ensure you have admin access to the repository
- Verify the `validate` status check name matches the workflow job name
- Check that branch protection rules are enabled in Settings → Branches

## 📚 Related Documentation

- [Branch Protection Setup](./BRANCH_PROTECTION.md)
- [PR Validation Workflow](./workflows/pr-validation.yml)
- [Deployment Workflow](./workflows/deploy.yml)
- [Link Validation Script](../scripts/validate-links.js)
