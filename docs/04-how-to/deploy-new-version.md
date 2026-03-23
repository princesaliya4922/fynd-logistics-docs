---
title: Deploy a New Version
sidebar_position: 4
---

# How To: Deploy a New Version

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How to build and deploy any of the three services.

---

## shopify-backend

### Build Docker Image

```bash
cd shopify-backend

# Build the image (requires AZURE_PRIVATE_TOKEN_BASE64 for private npm packages)
docker build \
  --build-arg AZURE_PRIVATE_TOKEN_BASE64=$AZURE_PRIVATE_TOKEN_BASE64 \
  -t shopify-backend:latest .
```

The Dockerfile is multi-stage:
1. **Build stage** — Installs Node 22 Alpine, resolves private npm packages, copies source
2. **Runtime stage** — Copies built app, exposes port 8000

### Deploy via Azure Pipelines (CI/CD)

1. Push to the configured branch (typically `main` or `release/*`)
2. Azure Pipelines auto-triggers on push
3. Pipeline runs:
   - `npm run lint`
   - `npm test`
   - Docker build
   - Deploy to FIK cluster
4. Monitor deploy in Azure DevOps

### Manual Deploy via FIK CLI

```bash
# Deploy to UAT
fik deploy shopify-backend --env fyndz5

# Deploy to Production
fik deploy shopify-backend --env fynd/m2
```

### Post-Deploy Verification

```bash
# Check health endpoint
curl https://shopify-backend.extensions.fynd.com/_healthz
# Expected: 200 OK

curl https://shopify-backend.extensions.fynd.com/_readyz
# Expected: 200 OK
```

---

## shopify-pincode-checker

### Build

```bash
cd shopify-pincode-checker

# Build frontend
cd web/frontend
SHOPIFY_API_KEY=<promise-api-key> npm run build

# Build Docker image
cd ../..
docker build -t shopify-pincode-checker:latest .
```

The Dockerfile:
- Installs web + frontend dependencies
- Builds frontend with Vite (`cd frontend && npm run build`)
- Exposes port 8081

### Deploy Shopify Extensions

Before deploying app code, deploy Shopify extensions:

```bash
# Deploy to production
shopify app deploy

# Deploy to specific environment
shopify app deploy --config shopify.app.promise-sit.toml
```

This uploads:
- `fynd-promise-checkout` (Checkout UI extension)
- `fynd-promise-pdp` (Theme extension)

### Deploy App Server

Push to the appropriate branch → Azure Pipelines handles Docker build + FIK deploy.

---

## shopify-logistics-app

### Build

```bash
cd shopify-logistics-app

# Build frontend
cd web/frontend
SHOPIFY_API_KEY=<logistics-api-key> npm run build

cd ../..
docker build -t shopify-logistics-app:latest .
```

### Deploy Shopify Extensions

```bash
shopify app deploy
# or
shopify app deploy --config shopify.app.fynd-logistics-uat.toml
```

Deploys:
- `fullfillment-extension` (Order details block)
- `fynd-promise-checkout` (Checkout UI extension)

---

## Environment-Specific Deployments

| Target | Config File | FIK Environment |
|--------|------------|-----------------|
| Dev | `shopify.app.*.toml` (dev variant) | local / ngrok |
| SIT | `shopify.app.*.sit.toml` | `fyndz0` |
| UAT | `shopify.app.fynd-*-uat.toml` | `fyndz5` |
| Production | `shopify.app.toml` | `fynd/m2` |

---

## Database Migrations

The backend uses MongoDB — no migration scripts are needed for most changes.

For index changes:

```bash
npm run create-indexes
# Runs scripts/create-indexes.js against the configured MongoDB
```

Run this after any schema changes that add new indices.

---

## Rolling Back

### FIK Rollback

```bash
# Roll back to previous deployment
fik rollback shopify-backend --env fyndz5
```

### Docker Tag Rollback

If you know the previous image tag:

```bash
docker pull shopify-backend:<previous-tag>
fik deploy shopify-backend --image shopify-backend:<previous-tag> --env fyndz5
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] Shopify extensions deployed (if changed)
- [ ] MongoDB indexes updated (if schema changed)
- [ ] Environment variables updated in Vault/Secrets (if new vars added)
- [ ] Health checks pass after deploy
- [ ] Monitor Sentry for new errors in first 30 minutes
