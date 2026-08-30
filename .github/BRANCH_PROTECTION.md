# Branch Protection Configuration

This document outlines the recommended branch protection settings for the `main` branch.

## Setting Up Branch Protection

Navigate to: Settings → Branches → Add rule

### Branch name pattern
- `main`

### Protect matching branches

#### ✅ Required Settings

1. **Require a pull request before merging**
   - ✅ Require approvals: 1
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from CODEOWNERS (if applicable)

2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - **Required status checks:**
     - `validate` (from PR Validation workflow)

3. **Require conversation resolution before merging**
   - ✅ Enable this to ensure all PR comments are addressed

4. **Additional restrictions**
   - ✅ Do not allow bypassing the above settings
   - ✅ Restrict who can push to matching branches (optional, but recommended)

#### ⚠️ Optional but Recommended

1. **Require signed commits**
   - Ensures commits are verified

2. **Include administrators**
   - Apply rules to admin users as well

3. **Restrict who can dismiss pull request reviews**
   - Limit to repository administrators

## Automated Setup via GitHub CLI

You can also configure branch protection using the GitHub CLI:

```bash
# Install GitHub CLI if not already installed
# brew install gh (macOS)
# or see: https://cli.github.com/

# Authenticate
gh auth login

# Set up branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null
```

## Verifying Protection

After setup, the main branch should show a 🔒 icon in the GitHub UI, indicating it's protected.

Test the protection by:
1. Attempting to push directly to main (should fail)
2. Creating a PR and verifying checks run
3. Ensuring merge is blocked until checks pass

## Status Checks

The following GitHub Actions workflows provide status checks:

### Currently Implemented
- **PR Validation** (`validate`): Runs linting, type and unit checks, production build,
  content/feed validation, and Chromium accessibility/browser QA

### Planned Additions
- **External Link Checker**: Extends the existing internal link and fragment validation
- **Performance Budget**: Lighthouse CI checks
