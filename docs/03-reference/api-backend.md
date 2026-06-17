---
title: Backend API Reference
sidebar_position: 1
---

# Backend API Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

Complete reference for all `shopify-backend` API endpoints. Interactive docs available at `/api-docs` (Swagger UI).

---

## Authentication

Most routes require one of:
- **Session Token Auth** — `Authorization: Bearer <shopify_session_jwt>` (frontend calls)
- **HMAC Auth** — `X-Shopify-Hmac-Sha256` header (Shopify webhooks)
- **Basic Auth** — `Authorization: Basic base64(user:pass)` (admin routes)
- **None** — Public endpoints (serviceability, sync)

---

## Health Check Routes

| Method | Path | Auth | Response |
|--------|------|------|---------|
| GET | `/` | None | `200 OK` — root health probe (returns `<html><body>200 OK</body></html>`) |

There are no `/_healthz` or `/_readyz` endpoints. Only `GET /` returns 200; every other unmatched route falls through to the catch-all 404 handler:

```json
{
  "status": "error",
  "message": "Route not found",
  "path": "<originalUrl>"
}
```

---

## Webhook Routes (`/webhook/*`)

### Shopify Store Webhooks

```
POST /webhook/store/:shop/:topic/:subtopic
```

**Auth:** HMAC (`?app=fynd-logistics` or `?app=fynd-promise`)

> Only the 3-segment `:shop/:topic/:subtopic` route is mounted. The handler joins `:topic` and `:subtopic` into the effective topic string (`<topic>/<subtopic>`), so a topic like `app/uninstalled` is split across both path params.

**Path params:**
- `:shop` — Shopify store domain (e.g., `my-store.myshopify.com`)
- `:topic` / `:subtopic` — Webhook topic split into two segments (e.g., `orders` + `create` → `orders/create`)

**Handled topics** (`controllers/webhook.controller.js`):

| Topic | Action |
|-------|--------|
| `inventory_levels/update` | Resolve variant/product via GraphQL, sync product mapping |
| `locations/create` | Fetch + save Fynd location |
| `locations/update` | Fetch + save Fynd location |
| `orders/create` | Promise billing tracking and/or logistics order processing |
| `app_subscriptions/update` | Validate against Shopify, update/cancel subscription |
| `app/uninstalled` | Clean up store data |
| `fulfillments/create` | Track new fulfillment (logistics) |
| `fulfillments/update` | Handle fulfillment cancellation (logistics) |
| `returns/cancel` | Handle return cancellation (logistics) |
| `returns/request` | Handle customer return request (logistics) |
| `returns/approve` | Handle return approval (logistics) |
| `returns/decline` | Handle return decline (logistics) |

> `orders/updated`, `orders/cancelled` and `products/update` are **not** handled — they fall through to the `default` branch and are logged as "invalid topic".

### GDPR Webhooks

```
POST /webhook/store/gdpr/:shop/:topic/:subtopic
```

**Handled topics:** `customers/data_request`, `customers/redact`, `shop/redact`

### Extension Status Webhook

```
POST /webhook/extension/status
```

**Auth:** Basic Auth

**Purpose:** Receives Fynd extension status update events.

### FLP Platform Webhook

```
POST /webhook/flp/shipment/update/:companyId
```

**Auth:** None (payload contains its own authentication)

**Purpose:** Receives shipment status updates from FLP Platform (OMS and native FLP payload formats).

**Path params:**
- `:companyId` — Fynd company ID used to resolve eligible stores for shipment status updates.

**Body:**
```json
{
  "event": "application/shipment/update/v1",
  "payload": {
    "shipment": {
      "id": "FY-SHIP-12345",
      "status": "delivered",
      "awb_no": "1234567890",
      "dp_name": "Delhivery"
    }
  }
}
```

---

## Sync Routes (`/map/*`)

### Sync Stores

```
POST /map/syncStores
```

**Auth:** None

**Purpose:** Fetches all Shopify locations for a store and syncs them to Fynd warehouse locations.

### Map Inventories

```
POST /map/mapInventories
```

**Auth:** Basic Auth

**Purpose:** Map Shopify inventory items to Fynd warehouse inventory.

### Sync Countries

```
GET /map/syncCountries
```

**Auth:** None

**Purpose:** Sync country/state reference data.

---

## Serviceability Routes (`/location/*`)

### Check Pincode Serviceability

```
POST /location/service
```

**Auth:** None (called directly from Shopify storefront extensions)

**Request body:**
```json
{
  "shop": "my-store.myshopify.com",
  "pincode": "400001",
  "products": [
    { "id": "shopify-product-id", "variantId": "variant-id" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serviceable": true,
    "promiseDate": "Mon 25 Mar - Wed 27 Mar",
    "deliveryPartner": "BlueDart",
    "promiseView": "range"
  }
}
```

### Get Cities by Country

```
POST /location/cities
```

**Auth:** None

**Request body:**
```json
{ "countryCode": "IN", "stateCode": "MH" }
```

---

## Configuration Routes (`/config/*`)

### Get Merchant Config

```
GET /config/merchant
```

**Auth:** None (internal use)

**Query params:** `?shop=my-store.myshopify.com`

**Response:** Full store configuration from MongoDB `stores` collection.

### Update Merchant Config

```
POST /config/merchant
```

**Auth:** None (internal use)

**Body:** Partial store config fields to update.

### Register Store

```
POST /config/register
```

**Auth:** None (called from frontend app's `fyndIntegration.js` during install)

**Body:**
```json
{
  "shop": "my-store.myshopify.com",
  "shopId": "shopify-shop-id",
  "email": "merchant@example.com",
  "name": "My Store",
  "token": "shopify-access-token",
  "domains": ["custom-domain.com"],
  "appName": "promise"
}
```

### Check/Create Subscription

```
POST /config/subscription
```

**Auth:** None

**Body:**
```json
{
  "shop": "my-store.myshopify.com",
  "appType": "promise",
  "subscriptionId": "shopify-subscription-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active": true,
    "plan": "Free",
    "ordersUsed": 23,
    "orderLimit": 50
  }
}
```

### Get Billing History

```
GET /config/billing
```

### Trigger Billing Cron

```
GET /config/billingCron
```

**Auth:** None

**Purpose:** Manually trigger the billing cron (for debugging/admin use).

### Update Fynd Promise Settings

```
POST /config/fyndPromise
```

**Auth:** None

**Body:** Promise-specific config fields (promiseView, courierPartners, etc.).

### Get All Shops

```
GET /config/shops
```

**Auth:** None

**Purpose:** List all registered stores (admin use).

### Courier Partner Routes

```
GET  /config/courier-partners
POST /config/courier-partners/seed
POST /config/courier-partners/clearSeed
```

---

## Account Linking & Email Verification (`/logistics/*`)

> The standalone `/logistics/otp/*` routes are defined in `routes/otpRoutes.js` but **not mounted** in `index.js`. OTP/account-linking is handled by the routes below, which are all session-authenticated.

### Account Linking (Sign-in to existing Fynd account)

```
POST /logistics/link          — Initiate link-existing flow (sends OTP)
POST /logistics/link/verify   — Verify OTP + complete link
```

**Auth:** Session Token

### Email Verification (Create-new account flow)

```
POST /logistics/email/send-otp              — Send OTP to candidate company email
POST /logistics/email/verify-otp            — Verify OTP, mark email verified
GET  /logistics/email/verification-status   — Read current verified-email state
POST /logistics/email/reset-verification    — Clear verified-email state on cancel
```

**Auth:** Session Token

---

## Logistics Routes (`/logistics/*`)

### Plan

```
GET /logistics/plan
```

**Auth:** Session Token

**Response:** Current subscription plan and usage for the shop.

### Configuration

```
GET /logistics/config
```

**Auth:** Session Token

**Response:** Full logistics configuration for the shop.

### Setup

```
GET /logistics/setup
PUT /logistics/setup
```

**Auth:** Session Token

`GET` — Fetch current logistics setup (warehouse mappings, preferences).

`PUT` — Save logistics setup:
```json
{
  "companyId": 123,
  "salesChannelId": "app-id",
  "processingTime": { "mode": "common", "value": 1 },
  "shippingPreference": "cheapest",
  "deliveryPromise": { "type": "range", "min": 2, "max": 4 }
}
```

### Fulfillment

```
POST /logistics/fulfill/orders/bulk                               — Fulfill multiple orders
GET  /logistics/fulfill/orders/:orderId/fulfillment-orders        — Get fulfillment orders
POST /logistics/fulfill/fulfillment                               — Fulfill a fulfillment order
POST /logistics/fulfill/fulfillment/carrier-assignment-status     — Poll carrier assignment status
```

**Auth:** Session Token + `logisticsEnabled` + `fulfillmentLimitCheck`

> The following routes are commented out / inactive in `routes/logisticsRoutes.js` and will 404:
> `POST /logistics/fulfill/orders/:orderId`, `GET /logistics/fulfill/orders/:orderId/status`, `GET /logistics/fulfill/orders/:orderId/fulfillment-status`.

### Companies & Account Linking

```
GET  /logistics/companies                           — List companies for shop
POST /logistics/companies/register                  — Register new company
GET  /logistics/companies/:companyId/saleschannels  — Get sales channels
POST /logistics/link                                — Start OTP account linking
POST /logistics/link/verify                         — Verify OTP + complete link
```

**Auth:** Session Token

### Location Management

```
GET  /logistics/locations/pincode/:pincode  — Resolve city/state/country by pincode
POST /logistics/locations/create            — Create a new Fynd location
```

**Auth:** Session Token

> Commented out / inactive (will 404): `GET /logistics/locations`, `PUT /logistics/locations/:locationId/mapping`, `PUT /logistics/locations/mappings`.

### Magic Link

```
GET /logistics/magic-link
```

**Auth:** Session Token

**Purpose:** Generate a one-time magic link into the Fynd console.

### Shipments

```
POST /logistics/shipments/documents
```

**Auth:** Session Token

**Body:**
```json
{
  "fulfillmentOrderIds": ["id1", "id2"],
  "documentType": "label"  // or "invoice"
}
```

### Returns

```
GET  /logistics/orders/:orderId/fulfillments/return-eligibility  — Check eligibility
POST /logistics/returns                                          — Create return
POST /logistics/returns/carrier-assignment-status               — Poll return carrier assignment status
```

**Auth:** Session Token

### Delivery Promise (Public)

```
POST /logistics/promise/check
```

**Auth:** None

**Purpose:** Called from Shopify storefront to calculate delivery promise.

**Body:**
```json
{
  "shop": "my-store.myshopify.com",
  "pincode": "400001",
  "lineItems": [...]
}
```

---

## Admin Routes (`/logistics/admin/*`)

Admin authentication is **OTP + session based** (not Basic Auth). All `/admin/api/*` routes after the auth endpoints are protected by `requireAdminSession`, `enforceAdminOrigin`, `enforceCsrfToken`, and `auditAdminAction`.

### Authentication

```
POST /logistics/admin/api/auth/request-otp   — Request login OTP
POST /logistics/admin/api/auth/verify-otp    — Verify OTP, establish session
POST /logistics/admin/api/auth/logout        — Logout (session + CSRF required)
GET  /logistics/admin/api/auth/session       — Read current admin session
```

> There is no `/logistics/admin/api/validate-password` route.

### Dashboard

```
GET  /logistics/admin              — Serve admin dashboard HTML
GET  /logistics/admin/api/stats    — Dashboard statistics
```

### Delivery Partners

```
GET    /logistics/admin/api/delivery-partners        — List all delivery partners
POST   /logistics/admin/api/delivery-partners        — Create delivery partner
PUT    /logistics/admin/api/delivery-partners/:id    — Update delivery partner
DELETE /logistics/admin/api/delivery-partners/:id    — Delete delivery partner
```

### Store Management

```
GET   /logistics/admin/api/stores                   — List all logistics stores
PATCH /logistics/admin/api/stores/:shop/toggle      — Enable/disable logistics
PATCH /logistics/admin/api/stores/:shop/plan        — Update store plan
PATCH /logistics/admin/api/stores/:shop/logistics-engine — Switch engine (flp/oms)
```

### Promise Admin

```
GET    /logistics/admin/api/promise/stats
GET    /logistics/admin/api/promise/courier-partners
POST   /logistics/admin/api/promise/courier-partners
POST   /logistics/admin/api/promise/courier-partners/seed
POST   /logistics/admin/api/promise/courier-partners/reseed
PUT    /logistics/admin/api/promise/courier-partners/:id
DELETE /logistics/admin/api/promise/courier-partners/:id
GET    /logistics/admin/api/promise/stores
PATCH  /logistics/admin/api/promise/stores/:shop/toggle-promise
PATCH  /logistics/admin/api/promise/stores/:shop/courier-partners
```

> `PATCH /logistics/admin/api/promise/stores/:shop/promise-view` is commented out / inactive.

---

## Standard Response Envelope

All non-webhook endpoints return:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": "optional details",
  "requestId": "x-request-id value"
}
```
