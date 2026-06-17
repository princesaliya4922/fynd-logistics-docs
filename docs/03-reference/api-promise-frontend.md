---
title: Promise App API Calls
sidebar_position: 6
---

# Fynd Promise Frontend API Calls

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

All API calls made by the `shopify-pincode-checker` React frontend to its own Express backend, which proxies most of them to the central Fynd backend (`BACKEND_URL`, referred to as `fyndBackendUrl` in `web/index.js`).

---

## Authentication

Authentication is mixed:

- **Some components** use the `useAuthenticatedFetch` hook, which adds `Authorization: Bearer <shopify_session_token>`.
- **Others** use raw `fetch('/api/...')` (e.g. `UserHandle.jsx`, `billing/index.jsx`, and `StepProgress.jsx` for `POST /api/updateConfig`).

Regardless of the client, the server enforces auth on every `/api/*` route via `shopify.validateAuthenticatedSession()` (see `web/index.js`). The `shop` is taken from the validated session (`res.locals.shopify.session.shop`), not from the request body.

```javascript
const authenticatedFetch = useAuthenticatedFetch()
// Adds: Authorization: Bearer <shopify_session_token>
```

---

## Endpoint Reference

### GET /api/shop

**Called by:** `RegionHandle.jsx`

**Purpose:** Fetch Shopify store details to check if store is in India.

**Response:** the **raw Shopify Shop object**, returned directly with no `shop` wrapper (the server does `Shop.all` and sends back the entry matching the session's `myshopify_domain`):

```json
{
  "name": "My Store",
  "email": "merchant@example.com",
  "country_code": "IN",
  "domain": "my-store.myshopify.com",
  "myshopify_domain": "my-store.myshopify.com",
  "currency": "INR"
}
```

**Usage:** the frontend reads `data.country_code`. If not `"IN"`, the app shows an "outside region" error.

---

### POST /api/subscription

**Called by:** `UserHandle.jsx`, `billing/index.jsx`

**Purpose:** Check current subscription status for this store. The server proxies `POST ${BACKEND_URL}/config/subscription` (with `{ shop }`) and returns the backend response **verbatim**, including its status code.

**Response:** shape is determined by the Fynd backend (backend-owned). The frontend consumes `result.status` and `result.data.status` (e.g. `active` / `expired`):

```json
{
  "status": true,
  "data": {
    "status": "active"
  }
}
```

> The previously documented `active` / `plan` / `ordersUsed` / `orderLimit` / `subscriptionId` fields are not what the frontend reads.

**Usage:** the frontend routes the merchant to billing/pricing based on `result.status` / `result.data.status`.

---

### GET /api/locations

**Called by:** `setting/index.jsx` (NewSetting component)

**Purpose:** Get merchant's configured locations and delivery settings. The server first calls `GET ${BACKEND_URL}/config/merchant?shop=...`. If that returns a non-empty `data.result`, the merchant is **already configured**; otherwise the server falls back to listing Shopify locations for onboarding.

**Response — not yet configured (onboarding):** built from Shopify `Location.all`, each item shaped `{ processingTime, cutOffTime, label, value, locationId }`:
```json
{
  "data": {
    "result": [
      {
        "processingTime": 1,
        "cutOffTime": null,
        "label": "Main Warehouse",
        "value": 123456789,
        "locationId": 123456789
      }
    ],
    "deliveryPreference": "1",
    "promiseView": "range"
  },
  "boarding": true
}
```

**Response — already configured:** the backend's config payload, with `boarding: false`:
```json
{
  "data": { "result": [ /* backend-owned config */ ] },
  "boarding": false
}
```

**Usage / semantics (important — these were previously inverted):**
- `boarding: true` ⇒ merchant is **NOT yet configured** (onboarding); the `DeliveryWidget` is shown.
- `boarding: false` ⇒ merchant **is configured**; the `StepProgress` view is shown.

The default `deliveryPreference` in the onboarding branch is the **string `'1'`** (not `"standard"`), and the default `promiseView` is `'range'`.

---

### POST /api/updateConfig

**Called by:** Settings components after merchant updates configuration (e.g. `StepProgress.jsx`, via raw `fetch`).

**Purpose:** Save merchant delivery configuration. The server proxies to `POST ${BACKEND_URL}/config/merchant` with a payload of `{ shop, ...req.body }` — i.e. `shop` is injected server-side from the session, so the client does not send it.

**Request body (client → app):** whatever the settings form sends, e.g.:
```json
{
  "promiseView": "range",
  "deliveryPreference": "1",
  "locationId": "shopify-location-id",
  "processingTime": 1
}
```

---

### POST /api/idVerification

**Called by:** Location setup flow.

**Purpose:** Verify a Shopify location ID against the Fynd backend. The server proxies the request body **as-is** to `POST ${BACKEND_URL}/location/idVerification` — `shop` is **not** injected here, so the client must include it if the backend needs it.

**Request body:** passed through unchanged, e.g.:
```json
{ "locationId": "shopify-location-id", "shop": "my-store.myshopify.com" }
```

---

### GET /api/themes

**Called by:** Theme setup component.

**Purpose:** Fetch the merchant's main (published) theme to guide PDP extension setup.

**Response:** a **single Theme object** — the server returns the theme whose `role === 'main'` from `Theme.all`, not an array:
```json
{ "id": 123, "name": "Dawn", "role": "main" }
```

---

### GET /api/billing

**Called by:** `billing/index.jsx`

**Purpose:** Generate Shopify billing confirmation URLs for the configured plans.

**Response:** note the **typo key `messagee`**; `data` is an array of Shopify billing confirmation URLs (one per plan):
```json
{
  "messagee": "success",
  "data": [
    "https://my-store.myshopify.com/admin/charges/.../confirm_application_charge?...",
    "https://my-store.myshopify.com/admin/charges/.../confirm_application_charge?..."
  ]
}
```

---

### GET /api/sync/status

**Called by:** Settings components.

**Purpose:** Check product sync status. The server proxies `GET ${BACKEND_URL}/register/syncStatus?shop=...`.

**Response:** the backend response wrapped under `data` (`{ data: <backend> }`):
```json
{ "data": { /* backend-owned sync status */ } }
```

---

### POST /api/sync/products

**Called by:** Settings — trigger manual product sync.

**Purpose:** Start syncing Shopify products. The server proxies `POST ${BACKEND_URL}/map/syncProducts` with `{ shop }`.

**Response:**
```json
{ "message": "sync started" }
```

---

### Dead references (not live)

`ProductsCard.jsx` calls `GET /api/products/count` and `POST /api/products`, but **no matching routes exist** in `web/index.js`. These are leftover scaffolding from the Shopify app template and do not resolve to working endpoints.

---

## Checkout Extension API Calls

These are called directly from the Shopify checkout context (not via the Express server):

### POST /location/service

**Called by:** `extensions/fynd-promise-checkout/src/Checkout.jsx`

**URL:** hardcoded `https://shopify-backend.extensions.fynd.com/location/service` (called directly, not through the Express server)

**Purpose:** Check pincode serviceability + get delivery promise. The pincode comes from the buyer's shipping address.

**Request body:**
```json
{
  "data": { /* cart line target (useCartLineTarget) */ },
  "shop": "my-store.myshopify.com",
  "pincode": "400001"
}
```

**Response (consumed fields):**
```json
{
  "status": true,
  "message": "Delivery by Mon 25 Mar - Wed 27 Mar",
  "dateRange": { "name": "BlueDart" }
}
```

> The extension reads only `status`, `message`, and `dateRange.name`. The previously documented `success` / `data.serviceable` / `data.promiseDate` / `data.deliveryPartner` shape is incorrect.

## PDP Extension API Calls

### POST /location/service

Same endpoint, called from `extensions/fynd-promise-pdp/assets/pincodeService.js`. URL is hardcoded to `https://shopify-backend.extensions.fynd.com/location/service`.

**Request body:**
```json
{
  "pincode": "400001",
  "productId": 123456789,
  "shop": "my-store.myshopify.com",
  "variantId": 987654321,
  "sku": "ABC-123"
}
```

**Response:** consumed as `content.status` (boolean), `content.message`, and `content.dateRange.name` — same fields as the checkout extension.
