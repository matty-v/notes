# Package Lock File Validation

## Problem

When `package.json` is updated with new dependencies but `package-lock.json` is not regenerated, deployments fail with:

```
npm error `npm ci` can only install packages when your package.json and
package-lock.json or npm-shrinkwrap.json are in sync. Please update your
lock file with `npm install` before continuing.
```

## Solution

This repository includes validation to prevent out-of-sync lock files from reaching production.

### Validation Script

The `validate-lockfile.js` script at the root of the repository checks if `package-lock.json` is in sync with `package.json`.

**Usage:**
```bash
node validate-lockfile.js
```

**Exit Codes:**
- `0` - Lock file is in sync ✅
- `1` - Lock file is out of sync or validation failed ❌

### Integration with GitHub Actions

To add validation to your deployment workflow, add this step **before** the `npm ci` step:

```yaml
- name: Validate package-lock.json sync
  run: node validate-lockfile.js
```

**Example integration in `.github/workflows/deploy.yml`:**

```yaml
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Add this validation step BEFORE npm ci
      - name: Validate package-lock.json sync
        run: node validate-lockfile.js

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      # ... rest of deployment steps
```

### Local Development

To prevent this issue locally, consider adding a pre-commit hook using Husky:

1. Install Husky (if not already installed):
   ```bash
   npm install --save-dev husky
   npx husky init
   ```

2. Create a pre-commit hook:
   ```bash
   echo "node validate-lockfile.js" > .husky/pre-commit
   chmod +x .husky/pre-commit
   ```

This will automatically validate the lock file before each commit.

### CI/CD for Pull Requests

Consider adding a check job to your PR workflow (`.github/workflows/test.yml` or similar):

```yaml
jobs:
  validate-lockfile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Validate package-lock.json
        run: node validate-lockfile.js
```

## Fixing Out-of-Sync Lock Files

If validation fails, fix it by running:

```bash
npm install
git add package-lock.json
git commit -m "chore: sync package-lock.json with package.json"
```

## Related Issues

- Issue #18: Initial implementation of lock file validation
- PR #17: Dependency added without lock file update (the incident that prompted this solution)
