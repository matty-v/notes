# Workflow Update Guide for Lock File Validation

## Why This Guide?

Due to GitHub App permissions, automated tools cannot modify workflow files in `.github/workflows/`. This guide provides step-by-step instructions to manually add lock file validation to your deployment workflow.

## What Needs to Change

The deployment workflow (`.github/workflows/deploy.yml`) needs a validation step added **before** the `npm ci` command runs. This will catch package-lock.json sync issues before they cause deployment failures.

## Step-by-Step Instructions

### 1. Open the Deployment Workflow

Edit `.github/workflows/deploy.yml`

### 2. Add the Validation Step

Find this section:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

- name: Install dependencies
  run: npm ci
```

Change it to:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

- name: Validate package-lock.json sync
  run: node validate-lockfile.js

- name: Install dependencies
  run: npm ci
```

### 3. Complete Updated Workflow

Here's the complete updated workflow file for reference:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

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

      - name: Validate package-lock.json sync
        run: node validate-lockfile.js

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: kinetic-object-322814
          target: matty-notes-pwa
          channelId: live
```

## What This Achieves

✅ **Fail Fast**: Deployments will fail immediately if lock file is out of sync, before wasting time on `npm ci`

✅ **Clear Error Messages**: The validation script provides helpful error messages explaining what went wrong

✅ **Prevention**: Catches the issue before it reaches production

## Testing the Change

After updating the workflow:

1. Commit and push the workflow change to a feature branch
2. Test by intentionally creating a mismatch (add a dependency to package.json without updating the lock file)
3. Verify the workflow fails with a clear error message
4. Fix with `npm install` and verify the workflow passes

## Optional: Add PR Validation

Consider also adding this validation to any PR check workflows to catch issues before merge. See `docs/lockfile-validation.md` for details.

## Questions?

See `docs/lockfile-validation.md` for more details on the validation system and local development setup.
