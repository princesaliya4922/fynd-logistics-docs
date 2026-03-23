---
title: Repository Structure
sidebar_position: 2
---

# Repository Structure

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Quick reference for the directory layout of each project.

---

## shopify-backend

```
shopify-backend/
├── server.js                    # Process entry point
├── index.js                     # Express app setup + route registration
├── config.js                    # Convict config schema (all env vars)
├── controllers/
│   ├── services/                # Business logic
│   │   ├── logisticsService.js  # Core logistics engine (186KB)
│   │   ├── fulfilmentService.js # Fulfillment processing (53KB)
│   │   ├── shopifyWebhookService.js # Webhook handlers (65KB)
│   │   ├── returnService.js     # Returns (44KB)
│   │   ├── shipmentService.js   # Shipment tracking (20KB)
│   │   └── linkExistingService.js # OTP account linking (15KB)
│   ├── fyndWebhookHandlers/     # Fynd platform webhook handlers
│   ├── adminController.js       # Admin dashboard
│   ├── promiseAdminController.js
│   ├── logisticsController.js
│   ├── fulfilment.controller.js
│   ├── return.controller.js
│   ├── webhook.controller.js
│   ├── store.controller.js
│   └── serviceability.controller.js
├── middlewares/
│   ├── shopifySessionAuth.js    # JWT verification
│   ├── shopifyHmacAuth.js       # Webhook HMAC
│   ├── basicAuth.js             # Basic auth
│   ├── fulfillmentLimitCheck.js # Free plan enforcement
│   ├── logisticsEnabled.js      # Feature flag check
│   ├── metricsMiddleware.js
│   └── securityMiddleware.js
├── model/                       # Mongoose schemas
│   ├── index.js                 # Central model exports
│   ├── stores.js
│   ├── logistics.js
│   ├── shipments.js
│   ├── orders.js
│   ├── returns.js
│   └── [8 more models]
├── routes/
│   ├── webhook.js
│   ├── sync.js
│   ├── serviceability.js
│   ├── configuration.js
│   ├── otpRoutes.js
│   ├── logisticsRoutes.js
│   └── flpWebhook.js
├── utils/
│   ├── common/
│   ├── fynd/                    # Fynd API wrappers
│   ├── shopify/                 # Shopify API utilities
│   ├── corsUtils.js
│   ├── errorHandler.js
│   ├── metrics.js
│   └── swaggerConfig.js
├── queue/                       # In-memory job queue
├── cron/                        # Cron job definitions
├── init/                        # Startup initializers
├── redis/                       # Redis cache utilities
├── fdk/                         # Fynd extension handler
├── public/                      # Admin dashboard static files
├── spec/
│   ├── testFiles/
│   └── testUtilites/
├── Dockerfile
├── azure-pipelines.yml
└── package.json
```

---

## shopify-pincode-checker

```
shopify-pincode-checker/
├── web/                         # Backend + Frontend monorepo
│   ├── index.js                 # Express mini-server
│   ├── shopify.js               # Shopify SDK init (SQLite sessions)
│   ├── config.js                # Convict config
│   ├── fyndIntegration.js       # Install hook: register + create webhooks
│   ├── billing.js               # Billing plan definitions
│   ├── logger.js
│   ├── sentry.js
│   ├── privacyPolicy.js
│   ├── package.json             # Backend deps
│   └── frontend/                # React SPA
│       ├── index.jsx            # React root
│       ├── App.jsx              # Providers + routing
│       ├── Routes.jsx           # File-based routing
│       ├── vite.config.js
│       ├── pages/
│       │   ├── index.jsx
│       │   ├── settings.jsx
│       │   └── pricing.jsx
│       ├── components/
│       │   ├── RegionHandle.jsx
│       │   ├── UserHandle.jsx
│       │   ├── setting/         # Delivery settings UI
│       │   ├── billing/         # Billing UI
│       │   ├── providers/       # App Bridge, Polaris, Query
│       │   └── common/
│       ├── hooks/
│       ├── locales/             # i18n: en, fr, de
│       └── utils/
├── extensions/
│   ├── fynd-promise-checkout/   # Checkout UI extension
│   │   ├── src/Checkout.jsx
│   │   └── shopify.extension.toml
│   └── fynd-promise-pdp/        # Theme extension
│       ├── assets/pincodeService.js
│       └── shopify.extension.toml
├── spec/
├── shopify.app.toml
├── Dockerfile
└── package.json                 # Root workspace
```

---

## shopify-logistics-app

```
shopify-logistics-app/
├── web/                         # Backend + Frontend monorepo
│   ├── index.js                 # Express mini-server (Redis sessions)
│   ├── shopify.js               # Shopify SDK init
│   ├── config.js
│   ├── fyndIntegration.js
│   ├── billing.js
│   └── frontend/
│       ├── index.jsx
│       ├── App.jsx
│       ├── Routes.jsx
│       ├── vite.config.js
│       ├── pages/
│       ├── components/
│       │   ├── RegionHandle.jsx
│       │   ├── UserHandle.jsx
│       │   ├── setting/         # Full setup flow components
│       │   │   ├── FyndSetup.jsx
│       │   │   ├── FyndSuccessSetup.jsx
│       │   │   ├── FyndExistingSetup.jsx
│       │   │   ├── EmailStep.jsx
│       │   │   ├── OtpStep.jsx
│       │   │   ├── SalesChannelSelection.jsx
│       │   │   └── views/ViewRenderer.jsx
│       │   ├── companySelection/ # Legacy components
│       │   ├── createNewAccount/
│       │   ├── billing/
│       │   ├── providers/
│       │   └── common/
│       ├── hooks/
│       ├── store/               # Jotai atoms
│       │   ├── navigationManager.js
│       │   ├── companyAtoms.js
│       │   ├── logisticsAtom.js
│       │   ├── setupAtoms.js
│       │   └── planAtoms.js
│       ├── utils/
│       │   └── apiClient.js     # useLogisticsApi hook
│       ├── constants.js
│       └── locales/
├── extensions/
│   ├── fullfillment-extension/  # Admin UI extension
│   │   ├── src/
│   │   │   ├── BlockExtension.jsx       # Order details block
│   │   │   └── ReturnBlockExtension.jsx # Returns block
│   │   └── shopify.extension.toml
│   └── fynd-promise-checkout/   # Shared checkout extension
├── spec/
├── shopify.app.toml
├── docker-compose.yml
├── Dockerfile
└── package.json
```
