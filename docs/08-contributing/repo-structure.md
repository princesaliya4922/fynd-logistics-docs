---
title: Repository Structure
sidebar_position: 2
---

# Repository Structure

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

Quick reference for the current `shopify-apps` monorepo layout. The three Shopify services used to live in individual repositories; the source-of-truth code now lives under `services/`.

---

## Monorepo Root

```
shopify-apps/
├── README.md
├── azure-pipeline.yaml          # tag-triggered monorepo pipeline
├── docs/
│   └── tagdeploy.md
├── scripts/
│   ├── import_service_repo.sh
│   ├── sync_uat_services.sh
│   ├── sync_production_services.sh
│   └── tagdeploy.sh
└── services/
    ├── shopify-backend/
    ├── shopify-pincode-checker/
    └── shopify-logistics-app/
```

The sync scripts still copy tracked files from the legacy service repositories into the monorepo snapshots:

| Monorepo Branch | Service | Source Branch |
|-----------------|---------|---------------|
| `uat` | `shopify-logistics-app` | `shopify-logistics-app@uat` |
| `uat` | `shopify-pincode-checker` | `shopify-pincode-checker@sit` |
| `uat` | `shopify-backend` | `shopify-backend@uat` |
| `production` | `shopify-logistics-app` | `shopify-logistics-app@production` |
| `production` | `shopify-pincode-checker` | `shopify-pincode-checker@master` |
| `production` | `shopify-backend` | `shopify-backend@production` |

---

## `services/shopify-backend`

```
services/shopify-backend/
├── server.js                    # process entry point; init Mongo/Redis; cron switch
├── index.js                     # FIT/Express app setup and route registration
├── config.js                    # Convict config schema
├── configs/
│   └── logistics.config.js
├── controllers/
│   ├── services/                # business logic
│   │   ├── adminAuthService.js
│   │   ├── appUninstallService.js
│   │   ├── emailVerificationService.js
│   │   ├── fulfilmentService.js
│   │   ├── linkExistingService.js
│   │   ├── logisticsEngineConfig.js
│   │   ├── logisticsService.js
│   │   ├── returnService.js
│   │   ├── shipmentService.js
│   │   ├── shopifyWebhookService.js
│   │   └── syncFulfilmentProcessor.js
│   ├── utils/
│   ├── validators/
│   ├── adminAuthController.js
│   ├── adminController.js
│   ├── billing.js
│   ├── emailVerificationController.js
│   ├── fulfilment.controller.js
│   ├── linkExistingController.js
│   ├── logisticsController.js
│   ├── promiseAdminController.js
│   ├── return.controller.js
│   ├── serviceability.controller.js
│   └── webhook.controller.js
├── middlewares/
│   ├── adminAuth.js             # OTP session + CSRF/origin admin auth
│   ├── basicAuth.js             # internal Basic Auth routes
│   ├── fulfillmentLimitCheck.js
│   ├── logisticsEnabled.js
│   ├── metricsMiddleware.js
│   ├── securityMiddleware.js
│   ├── shopifyHmacAuth.js
│   └── shopifySessionAuth.js
├── model/                       # Mongoose schemas
├── routes/
│   ├── configuration.js
│   ├── flpWebhook.js
│   ├── logisticsRoutes.js
│   ├── otpRoutes.js             # present but not mounted
│   ├── serviceability.js
│   ├── sync.js
│   └── webhook.js
├── cron/
├── data/
├── fdk/
├── init/
├── jobs/
├── public/admin/                # static admin dashboard assets
├── queue/
├── redis/cache/
├── scripts/create-indexes.js
├── spec/
├── utils/
├── Dockerfile
├── azure-pipelines.yml          # legacy/service-local pipeline file
└── package.json
```

---

## `services/shopify-pincode-checker`

```
services/shopify-pincode-checker/
├── web/
│   ├── index.js                 # Express mini-server and API proxy
│   ├── shopify.js               # Shopify SDK init with SQLite sessions
│   ├── config.js                # HOST, BACKEND_URL, BASE_API_KEY, SENTRY_DSN
│   ├── fyndIntegration.js       # install hook: register store + webhooks
│   ├── billing.js
│   ├── privacyPolicy.js
│   ├── package.json
│   └── frontend/
│       ├── index.jsx
│       ├── App.jsx
│       ├── Routes.jsx
│       ├── vite.config.js
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── locales/
│       └── utils/
├── extensions/
│   ├── fynd-promise-checkout/
│   │   ├── src/Checkout.jsx
│   │   ├── locales/
│   │   └── shopify.extension.toml
│   └── fynd-promise-pdp/
│       ├── assets/pincodeService.js
│       ├── blocks/pincode_service.liquid
│       ├── snippets/
│       └── shopify.extension.toml
├── spec/testFiles/
├── spec/testUtilites/
├── shopify.app.toml
├── shopify.app.fynd-promise-testing.toml
├── shopify.app.pincode-serviceability-test.toml
├── Dockerfile
└── package.json
```

---

## `services/shopify-logistics-app`

```
services/shopify-logistics-app/
├── web/
│   ├── index.js                 # Express mini-server and API proxy
│   ├── shopify.js               # Shopify SDK init with Redis sessions
│   ├── config.js                # includes REDIS_SHOPIFY_BACKEND_READ_WRITE
│   ├── fyndIntegration.js       # install hook: register store + webhooks
│   ├── billing.js
│   ├── privacyPolicy.js
│   ├── package.json
│   └── frontend/
│       ├── index.jsx
│       ├── App.jsx
│       ├── Routes.jsx
│       ├── pages/
│       ├── components/
│       ├── config/
│       ├── hooks/
│       ├── store/               # Jotai atoms + navigation manager
│       ├── locales/
│       └── utils/
├── extensions/
│   ├── fullfillment-extension/  # order detail blocks
│   ├── order-fullfilment/       # order actions, bulk fulfill, label print
│   ├── fynd-promise-checkout/   # logistics-bundled checkout extension
│   └── fynd-promise-pdp/        # logistics-bundled PDP extension
├── spec/testFiles/
├── spec/testUtilites/
├── shopify.app.fynd-logistics-dev-devx.toml
├── shopify.app.fynd-logistics-uat.toml
├── shopify.app.fynd-logistics-prod.toml
├── shopify.app.toml             # default file is Promise-branded, not prod logistics
├── docker-compose.yml
├── Dockerfile
└── package.json
```
