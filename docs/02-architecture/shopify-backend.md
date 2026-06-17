---
title: Backend Architecture
sidebar_position: 2
---

# shopify-backend Architecture

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

Deep-dive into the `shopify-backend` service — the central engine powering both Fynd Shopify apps.

> **Dependencies:** The backend has **no** `@shopify/*` dependency. It uses `fdk-extension-javascript`, `@gofynd/fdk-client-javascript`, and custom HMAC middleware for Shopify integration. Logging is via `fit/tracing` (not Winston).

---

## Layered Architecture

```
┌─────────────────────────────────────────────────┐
│                  HTTP Layer                      │
│   index.js — Express app, middleware, routes     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Middleware Layer                    │
│  Global: metricsMiddleware  CORS                 │
│          securityHeaders    validateHeaders      │
│  Route-scoped: shopifySessionAuth shopifyHmacAuth│
│          basicAuth  logisticsEnabled             │
│          fulfillmentLimitCheck  adminAuth        │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│               Controllers Layer                  │
│  logisticsController  adminController            │
│  fulfilment.controller  return.controller        │
│  webhook.controller   store.controller           │
│  serviceability.controller  ...                  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                Services Layer                    │
│  logisticsService (186KB — core engine)         │
│  fulfilmentService (53KB)                        │
│  shopifyWebhookService (65KB)                    │
│  returnService (44KB)                            │
│  shipmentService (20KB)                          │
│  linkExistingService (15KB)                      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Data / Integration Layer            │
│  Mongoose Models (MongoDB)                       │
│  Redis Cache                                     │
│  Fynd API Clients (axios)                        │
│  Shopify Admin API                               │
└─────────────────────────────────────────────────┘
```

---

## Entry Points

### `server.js` — Process Bootstrap

Runs first on `npm start` or `npm run dev`. Responsibilities:
1. Load `.env` via dotenv
2. Handle SSL bypass for VPN environments (dev only)
3. Initialize MongoDB connection (`Fit.connections.mongo`)
4. Initialize Redis connection (`Fit.connections.redis`)
5. Set up global error handlers for uncaught exceptions / unhandled rejections
6. Choose mode: `index.js` (web server) or `cron/index.js` (cron job) based on `config.mode === 'cron'`
7. Handle `SIGTERM` for graceful shutdown

### `index.js` — Application Setup

Builds the Express application:
1. Initialize Sentry via `./init`
2. Patch `body-parser` to capture raw request bodies (needed for HMAC verification)
3. Register middleware (metrics, CORS, security headers, validation)
4. Register all route handlers (in priority order)
5. Return 200 for root path (health probe), 404 for unknown routes
6. Initialize FIT Server with Sentry error handler

---

## Middleware Execution Order

Global middleware is registered in `index.js` (lines ~68-85) in this order:

```
Request
  → metricsMiddleware (record request start)
  → CORS check (async corsService.getCorsOptions() — dynamic allowed origins)
  → securityHeaders (securityMiddleware — set security headers)
  → validateHeaders (securityMiddleware — validate required headers)
  → body-parser (JSON + raw body capture, configured on the FIT server)
  → Route-specific middleware (route-scoped, NOT global):
      For /logistics/* → shopifySessionAuth (JWT verify) → logisticsEnabled → fulfillmentLimitCheck
      For /webhook/store/* → shopifyHmacAuth (HMAC verify)
      For /logistics/admin/api/* → requireAdminSession → enforceAdminOrigin → enforceCsrfToken
      For /map/mapInventories and /webhook/extension/status → basicAuth
  → Controller function
  → asyncHandler error propagation
  → Global error handler (errorHandler.js)
  → metricsMiddleware (record request end)
Response
```

> **Note:** `securityMiddleware` exports two functions, `securityHeaders` and `validateHeaders`, registered as separate global middlewares. `basicAuth`, `fulfillmentLimitCheck`, and `logisticsEnabled` are route-scoped, not global.

---

## Route Registration Order

Routes are registered in `index.js` (lines ~88-129) in this order:

```
1. /                                     — FDK extension handler (Fynd platform webhook registry)
2. /webhook/*                            — Shopify webhooks (HMAC auth on /store/*)
3. /api/v1/fynd/webhooks                 — Fynd platform webhooks (inline POST handler)
4. /api-docs                             — Swagger UI
5. /map/*                                — Sync routes
6. /location/*                           — Serviceability routes
7. /config/*                             — Configuration routes
8. /logistics/admin/assets               — Static admin dashboard assets
9. /logistics/*                          — Main logistics routes (session auth + admin)
10. /webhook/flp/*                       — FLP platform webhooks
```

> **Note:** `/webhook` is mounted before `/webhook/flp`. There is no `/logistics/otp` mount — `routes/otpRoutes.js` is dead/unused. The real OTP and account-linking flows live under `/logistics/email/*` and `/logistics/link*` in `routes/logisticsRoutes.js`:
>
> - `POST /logistics/email/send-otp`, `POST /logistics/email/verify-otp`, `GET /logistics/email/verification-status`, `POST /logistics/email/reset-verification`
> - `POST /logistics/link`, `POST /logistics/link/verify`

---

## Session Management

The backend manages sessions for **two separate Shopify apps**:

| App | Session Storage | Store Token Field | JWT Secret Config Key |
|-----|----------------|-------------|----------------------|
| Fynd Promise | SQLite (in the Promise app server) | `promise_shopifyToken` | `shopify_app.promise_api_secret` |
| Fynd Logistics | Redis (in the Logistics app server) | `shopifyToken` | `shopify_app.logistics_api_secret` |

When a request comes to `shopify-backend`, the `shopifySessionAuth` middleware:
1. Extracts the `Authorization: Bearer <jwt>` header
2. Decodes the JWT (signed by Shopify using the app's API secret)
3. Extracts `dest` (shop domain) and `aud` (API key) claims
4. Validates `aud` matches the configured API key for that app
5. Looks up the store in MongoDB using the shop domain
6. Attaches `req.shop`, `req.store`, `req.shopifyToken` for downstream use

The `createSessionAuth({ apiSecretKey, apiKeyConfig, tokenField, appLabel })` factory (in `middlewares/shopifySessionAuth.js`) takes a config object and creates app-specific middleware instances. It exports `shopifyLogisticsSessionAuth`, `shopifyPromiseSessionAuth`, and `shopifySessionAuth` (an alias for the logistics variant).

---

## Fulfillment Processing Modes

The backend supports two modes for processing fulfillment jobs, controlled by `FULFILLMENT_PROCESSING_MODE`:

### `sync` (default)
Fulfillment is processed inline during the HTTP request. The request waits for the fulfillment to complete (or timeout).

- Timeout: `FULFILLMENT_SYNC_TIMEOUT` (default 60s)
- Retries: `FULFILLMENT_SYNC_MAX_RETRIES` (default 3)
- Retry delay: `FULFILLMENT_SYNC_RETRY_DELAY` with exponential backoff

### `memory-queue`
Fulfillment jobs are added to an in-memory `FakeQueue` (worker thread pool) and processed asynchronously.

- Queue: `queue/queue.js` — FakeQueue with configurable concurrency
- Workers: `queue/worker.js`
- Features: auto-retry, exponential backoff, job state tracking
- The HTTP request returns immediately; fulfillment happens in the background

---

## Fulfillment Engines

The backend supports two fulfillment engines. The engine is configured **per store** via the `logisticsEngine` field on the `logistics` document (`model/logistics.js`, enum `["flp","oms"]`). The schema-level default is `"flp"`, but the field getter returns `"oms"` when the value is unset, so unset stores effectively resolve to `oms`.

| Engine | Description |
|--------|-------------|
| `flp` | FLP Platform — Fynd's logistics platform |
| `oms` | Fynd OMS — order management system |

When a shipment is created, the store's engine is snapshotted into the shipment's `fulfillment_engine` field (`model/shipments.js`, enum `['oms','flp']`, `default: undefined`). This field is only a snapshot of the store setting at creation time.

The admin dashboard toggle for this setting is `logistics-engine`.

---

## Billing Cron Job

When `config.mode === 'cron'`, the server runs `cron/index.js` instead of the web server. The job dispatched is keyed off `config.get('cron_job')` (env `CRON_JOB`). Recognized cron job types (`cron/index.js`) are:

- `billing_trigger`
- `billing_trigger_last_day`
- `test_cron_job`

The billing logic lives in `controllers/billing.js`. It queries `subscriptions.find({ status: 'ACTIVE', plan: 'Growth' })`, and for each matching subscription counts orders in the cycle window, updates `consumedAmount` on the subscription, and creates a `transactions` document.

> **Known issue:** The cron query filters on `status: 'ACTIVE'` (uppercase), but the `subscriptions` model enum is lowercase (`active`, `cancelled`, `expired`, `uninstalled`), so the filter matches no documents. The order count uses `orders.find({ storeId, createdAt })`, but the `orders` model has no `storeId` field. The cron does **not** apply a free-tier deduction, does **not** advance the billing-cycle date, and does **not** read or set `isBilled`; it only updates `consumedAmount` and writes a transaction record.

**Schedule:** The cron schedule itself is external (configured in FIK), not in this repo.

---

## Error Handling

Many controller functions are wrapped with `asyncHandler(fn)` from `utils/errorHandler.js`, which catches thrown errors and passes them to Express's error handling middleware.

**Error response shapes (common patterns, not a single enforced envelope):**

Error responses are inconsistent across the codebase — there is no central enforced envelope:

```json
// webhook / HMAC middleware
{ "status": false, "message": "..." }

// 404 handler (index.js)
{ "status": "error", "message": "...", "path": "..." }

// many controllers
{ "success": false, "message": "...", "errorCode": "..." }
```

A `requestId` is rarely present. Logging is handled via `fit/tracing`. 4xx/5xx routing to `warn`/`error`/Sentry follows common patterns rather than a strictly enforced rule.

---

## Admin Dashboard

A built-in admin dashboard is available at `/logistics/admin`. It is **no longer Basic Auth** — it uses an OTP + session + CSRF + origin-check system:

- Middleware: `middlewares/adminAuth.js` — `requireAdminSession`, `enforceAdminOrigin`, `enforceCsrfToken`, `auditAdminAction`
- Controllers: `controllers/adminAuthController.js`, `controllers/services/adminAuthService.js`
- Auth routes: `POST /logistics/admin/api/auth/request-otp`, `POST /logistics/admin/api/auth/verify-otp`, `POST /logistics/admin/api/auth/logout`, `GET /logistics/admin/api/auth/session`
- Config keys (`admin_auth.*`): `ADMIN_AUTH_STRICT`, `ADMIN_ALLOWED_EMAILS`, `ADMIN_OTP_TTL_SECONDS`, `ADMIN_OTP_MAX_ATTEMPTS_PER_CHALLENGE`, `ADMIN_SESSION_TTL_SECONDS`

`BOLTIC_USERNAME`/`BOLTIC_PASSWORD` Basic Auth is now used **only** for `/map/mapInventories` and `/webhook/extension/status`.

Capabilities:
- View aggregate stats (stores, orders, fulfillments)
- Manage delivery partners (CRUD)
- Toggle logistics on/off per store
- Update store plans
- Switch fulfillment engine per store
- Manage promise courier partners
- Toggle promise on/off per store

Static HTML/JS dashboard served from `public/` directory.
