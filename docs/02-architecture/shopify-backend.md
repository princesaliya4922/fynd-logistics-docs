---
title: Backend Architecture
sidebar_position: 2
---

# shopify-backend Architecture

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Deep-dive into the `shopify-backend` service — the central engine powering both Fynd Shopify apps.

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
│  shopifySessionAuth  shopifyHmacAuth  basicAuth  │
│  fulfillmentLimitCheck  logisticsEnabled         │
│  metricsMiddleware   securityMiddleware          │
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
6. Choose mode: `index.js` (web server) or `cron/index.js` (cron job) based on `MODE` env var
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

Every authenticated request passes through this stack:

```
Request
  → metricsMiddleware (record request start)
  → CORS check (corsUtils.js — regex-based domain validation)
  → securityMiddleware (set security headers, validate required headers)
  → body-parser (JSON + raw body capture)
  → Route-specific middleware:
      For /logistics/* → shopifySessionAuth (JWT verify) → logisticsEnabled → fulfillmentLimitCheck
      For /webhook/* → shopifyHmacAuth (HMAC verify)
      For /logistics/admin/* → basicAuth
  → Controller function
  → asyncHandler error propagation
  → Global error handler (errorHandler.js)
  → metricsMiddleware (record request end)
Response
```

---

## Route Registration Order

Routes are registered in `index.js` in this order:

```
1. FDK extension handler (root)          — Fynd platform webhook registry
2. /api/v1/fynd/webhooks                 — Fynd platform webhooks
3. /api-docs                             — Swagger UI
4. /map/*                                — Sync routes
5. /location/*                           — Serviceability routes
6. /config/*                             — Configuration routes
7. /logistics/otp/*                      — OTP routes (no session auth)
8. /logistics/*                          — Main logistics routes (session auth)
9. /webhook/flp/shipment/update/:companyId — FLP platform webhooks
10. /webhook/*                           — Shopify webhooks (HMAC auth)
```

---

## Session Management

The backend manages sessions for **two separate Shopify apps**:

| App | Session Storage | Token Field | JWT Secret Config Key |
|-----|----------------|-------------|----------------------|
| Fynd Promise | SQLite (in the Promise app server) | `shopifyToken` | `shopify_app.promise_api_secret` |
| Fynd Logistics | Redis (in the Logistics app server) | `shopifyToken` (Logistics) | `shopify_app.logistics_api_secret` |

When a request comes to `shopify-backend`, the `shopifySessionAuth` middleware:
1. Extracts the `Authorization: Bearer <jwt>` header
2. Decodes the JWT (signed by Shopify using the app's API secret)
3. Extracts `dest` (shop domain) and `aud` (API key) claims
4. Validates `aud` matches the configured API key for that app
5. Looks up the store in MongoDB using the shop domain
6. Attaches `req.shop`, `req.store`, `req.shopifyToken` for downstream use

The `createSessionAuth(appType)` factory creates app-specific middleware instances.

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

The backend supports two fulfillment engines, stored per-shipment in `fulfillment_engine`:

| Engine | Description | Used When |
|--------|-------------|----------|
| `flp` | FLP Platform — Fynd's primary logistics platform | Default for most merchants |
| `oms` | Fynd OMS — order management system | Alternative for certain merchants/setups |

The engine is determined during shipment creation and stored in the `shipments` MongoDB collection.

---

## Billing Cron Job

When `MODE=cron` and `CRON_JOB=billing_trigger`, the server runs `cron/index.js` instead of the web server:

1. Fetches all active subscriptions from MongoDB
2. For each store with a billing cycle due:
   - Counts fulfilled orders in the billing period
   - Creates Shopify Usage Records for chargeable orders
   - Updates subscription billing cycle dates
3. Exits after completion

**Schedule (configured in FIK):** 7th, 14th, 21st, 28th of each month at midnight.

---

## Error Handling

All controller functions are wrapped with `asyncHandler(fn)` from `utils/errorHandler.js`. This catches any thrown errors and passes them to Express's error handling middleware.

**Standard error response:**
```json
{
  "success": false,
  "message": "Human-readable description",
  "errorCode": "SPECIFIC_ERROR_CODE",
  "errors": "optional detail",
  "requestId": "from x-request-id header"
}
```

**Error routing:**
- 4xx errors → logged as `warn`, NOT sent to Sentry
- 5xx errors → logged as `error`, sent to Sentry

---

## Admin Dashboard

A built-in admin dashboard is available at `/logistics/admin` (protected by basic auth `BOLTIC_USERNAME`/`BOLTIC_PASSWORD`).

Capabilities:
- View aggregate stats (stores, orders, fulfillments)
- Manage delivery partners (CRUD)
- Toggle logistics on/off per store
- Update store plans
- Switch fulfillment engine per store
- Manage promise courier partners
- Toggle promise on/off per store

Static HTML/JS dashboard served from `public/` directory.
