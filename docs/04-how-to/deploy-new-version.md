---
title: Deploy a New Version
sidebar_position: 4
---

# How To: Deploy a New Version

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

How to build and deploy the Shopify services from the current `shopify-apps` monorepo.

---

## 1. Choose the Target Branch

```bash
cd shopify-apps
git checkout uat
# or
git checkout production
```

If the target branch should be refreshed from the legacy service repositories, run the matching sync script first:

```bash
./scripts/sync_uat_services.sh
./scripts/sync_production_services.sh
```

Review and commit any service snapshot changes before deploying.

---

## 2. Run Service Checks Locally

Run commands inside the service you changed:

```bash
cd services/shopify-backend
npm test
npm run lint

cd ../shopify-pincode-checker
npm test
npm run build

cd ../shopify-logistics-app
npm test
npm run build
```

There is no root monorepo npm workspace command for all three services.

---

## 3. Trigger Azure Deployment

The active pipeline is `shopify-apps/azure-pipeline.yaml`. It triggers on `deploy.*` tags only.

```bash
source scripts/tagdeploy.sh
tagdeploy <env>
```

Useful variants:

```bash
tagdeploy cmlz0 --services shopify-backend
tagdeploy cmlz0 --services shopify-backend,shopify-logistics-app
tagdeploy cmlz0 --build-all
tagdeploy fynd --services shopify-pincode-checker
```

The root pipeline builds services from `services/*` and can skip unchanged services when `buildOnlyWhenChanged` is honored by the shared infrastructure template.

---

## 4. Deploy Shopify Extensions

Shopify-hosted extension assets are deployed separately with Shopify CLI from the relevant app service root.

### Fynd Promise

```bash
cd services/shopify-pincode-checker
npm run deploy

# UAT/test config
shopify app deploy --config shopify.app.pincode-serviceability-test.toml
```

Deploys:

- `fynd-promise-checkout`
- `fynd-promise-pdp`

### Fynd Logistics

```bash
cd services/shopify-logistics-app
npm run deploy

# UAT config
shopify app deploy --config shopify.app.fynd-logistics-uat.toml

# Production config
shopify app deploy --config shopify.app.fynd-logistics-prod.toml
```

Deploys the logistics admin extensions plus the bundled checkout/PDP extension copies present in the logistics app.

---

## 5. Post-Deploy Verification

```bash
curl -i https://shopify-backend.extensions.fynd.com/
curl -I https://shopify-backend.extensions.fynd.com/api-docs
```

Then verify:

- Azure pipeline completed for the intended services.
- Sentry and logs have no new error spike.
- Shopify app install/OAuth works for a test store.
- Promise checkout/PDP extensions render after extension deploy.
- Logistics order details extensions can call backend APIs.

`/_healthz` and `/_readyz` are not current backend endpoints.

---

## Database Indexes

For backend index changes:

```bash
cd services/shopify-backend
npm run create-indexes
```

This runs `scripts/create-indexes.js` against the configured MongoDB.
