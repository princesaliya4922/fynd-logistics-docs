---
title: CI/CD
sidebar_position: 4
---

# CI/CD Pipeline

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## Pipeline Overview

All three projects use **Azure Pipelines** for CI/CD, with **GitLab CI** as an alternative.

**Pipeline file location in each repo:** `azure-pipelines.yml`

The `fik-fynd-extensions` repo contains:
- `azure-pipelines.yml` — FIK infrastructure deploy pipeline
- `.gitlab-ci.yml` — GitLab CI alternative

---

## CI Pipeline (Test + Build)

Triggered on every push to feature branches and PRs:

```yaml
stages:
  - lint
  - test
  - build
  - docker-build
  - deploy-sit      # auto-deploy to SIT
```

### Steps

1. **Lint** — `npm run lint`
2. **Test** — `npm test` (Jest with coverage)
3. **Build** — `npm run build` (frontend Vite build)
4. **Docker Build** — Multi-stage Docker build (requires `AZURE_PRIVATE_TOKEN_BASE64`)
5. **Push to Registry** — Docker image pushed to Azure Container Registry
6. **Deploy to SIT** — Automatic deploy to `fyndz0`

### Private Package Authentication

The Docker build requires Azure DevOps token to install private packages:
```
--build-arg AZURE_PRIVATE_TOKEN_BASE64=$AZURE_PRIVATE_TOKEN_BASE64
```

This must be set as a secret variable in Azure Pipelines.

---

## CD Pipeline (Deploy)

### Automatic Deploys

| Branch/Tag | Target Environment |
|-----------|-------------------|
| `main` (after merge) | SIT (`fyndz0`) |
| `release/*` | UAT (`fyndz5`) |
| Manual trigger | Production (`fynd/m2`) |

### Manual Production Deploy

1. Go to Azure DevOps → Pipelines
2. Find the relevant pipeline
3. Click **Run pipeline**
4. Select **Stage: deploy-production**
5. Choose the image tag (from a successful UAT deploy)
6. Click **Run**

---

## FIK Deploy Configuration

The `fik-fynd-extensions` repo controls the Kubernetes deployments. FIK reads configs from the environment folders and applies them.

### Pipeline Integration

FIK integrations configured in `azure-pipelines.yml`:

```yaml
sentryConfigKey: fext
pagerdutyConfigKey: fext
newRelicConfigKey: fext
grafanaConfigKey: fext
newRelicEnabledEnvironments:
  - fynd
  - fyndx5
  - fyndz6
pagerdutyEnabledEnvironments:
  - Fynd    # Production only
```

---

## Test Configuration

### shopify-backend

```json
{
  "jest": {
    "collectCoverage": true,
    "collectCoverageFrom": ["<rootDir>/routes/**/*.js"],
    "coverageReporters": ["json-summary", "json"]
  }
}
```

Run with: `jest --detectOpenHandles --runInBand`
- `--runInBand` ensures tests run sequentially (important for MongoDB connection management)
- `--detectOpenHandles` helps identify resource leaks

### shopify-pincode-checker / shopify-logistics-app

Same Jest configuration. Tests in `spec/testFiles/`.

---

## Shopify Extension Deployment

Extensions (Checkout UI, Theme, Admin UI) are deployed separately from the app server:

```bash
# Runs during the extension deploy pipeline step
shopify app deploy
```

This command:
1. Bundles all extension code
2. Uploads to Shopify Partners platform
3. Extensions become available to all stores that have the app installed

**Important:** Extension deploys do NOT require app reinstallation by merchants. The new extension code is fetched automatically by Shopify.

---

## Deployment Verification

After any deploy:

```bash
# 1. Check health
curl https://shopify-backend.extensions.fynd.com/_healthz

# 2. Check readiness
curl https://shopify-backend.extensions.fynd.com/_readyz

# 3. Check Swagger docs loaded
curl -I https://shopify-backend.extensions.fynd.com/api-docs

# 4. Check Sentry for new errors (first 15 min post-deploy)
```

---

## Rollback Process

See [Operations → Rollback](./rollback.md) for rollback procedures.
