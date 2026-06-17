---
title: Logistics App API Calls
sidebar_position: 7
---

# Fynd Logistics Frontend API Calls

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

All API calls made by the `shopify-logistics-app` React frontend.

---

## Authentication

All calls use `useLogisticsApi` hook from `web/frontend/utils/apiClient.js`:

```javascript
const api = useLogisticsApi()
// Adds: Authorization: Bearer <shopify_session_token>
// Auto-retries once on 401/403 with fresh session token
```

> **Proxy note:** Most `/api/*` endpoints are thin proxies in the frontend mini-server (`web/index.js`) to `shopify-backend` at `config.get("backend_url")`, authenticated with the `x-api-key: <BASE_API_KEY>` header. The `shop` value is always taken from the session (`res.locals.shopify.session.shop`), **not** from the request body — so any `shop` field in a request body is ignored. Several `POST /api/*` routes proxy to backend `GET` endpoints (noted per-endpoint below). Response shapes are defined by the backend; the examples below are illustrative.

---

## Core Setup Flow APIs

### GET /api/shop

**Called by:** `RegionHandle.jsx`

Same as Promise app — fetches store details, checks `country_code === 'IN'`.

---

### GET /api/locations

**Called by:** `UserHandle.jsx`, location setup components

**Purpose:** Fetch all warehouse locations for the store.

**Response:**
```json
{
  "data": {
    "result": [
      {
        "shopifyLocationId": "loc-123",
        "name": "Mumbai Warehouse",
        "address": { "pincode": "400001", "city": "Mumbai" },
        "fyndLocationId": "fynd-loc-456",
        "isMapped": true
      }
    ]
  }
}
```

---

### POST /api/getcompanies

**Called by:** `UserHandle.jsx`, company selection

**Purpose:** Fetch Fynd companies associated with a shop (after OTP verification).

**Request body:** ignored.

**Proxies to:** `GET ${backend}/logistics/companies?shop=<session.shop>` (shop from session).

**Response:** backend-defined (e.g. a list of `{ companyId, name, uid }`).

---

### POST /api/getsaleschannel

**Called by:** `SalesChannelSelection.jsx`

**Purpose:** Fetch sales channels for a selected Fynd company.

**Request body:**
```json
{ "company": 123 }
```
(Uses `req.body.company` — note: `company`, not `companyId`.)

**Proxies to:** `GET ${backend}/logistics/companies/${company}/saleschannels?shop=<session.shop>`.

**Response:** backend-defined list of sales channels.

---

### POST /api/getsetup

**Called by:** `FyndExistingSetup.jsx`

**Purpose:** Fetch current setup configuration for a store.

**Request body:**
```json
{ "view": "existing-setup" }
```
The `view` param is **required** — it is forwarded as a query param.

**Proxies to:** `GET ${backend}/logistics/setup?shop=<session.shop>&view=<view>`.

**Response:** backend-defined setup object.

---

### POST /api/updateSetup

**Called by:** `FyndSetup.jsx` on form submit

**Purpose:** Save complete logistics setup configuration.

**Behavior:** Forwards the request body via HTTP **PUT** to `${backend}/logistics/setup?shop=<session.shop>`. (Persistence to MongoDB is backend behavior.)

**Request body:** the full setup payload, e.g.:
```json
{
  "companyDetails": { "companyId": 123 },
  "salesChannelDetails": { "applicationId": "app-id" },
  "processingTime": { "mode": "common", "value": 1 },
  "shippingPreference": "cheapest",
  "pickupLocations": [
    { "shopifyLocationId": "loc-123", "fyndLocationId": "fynd-456" }
  ]
}
```

---

## OTP Flow APIs

### POST /api/sendOtp

**Called by:** `EmailStep.jsx`

**Purpose:** Send OTP to the merchant's Fynd company email (link-existing flow).

**Request body (from frontend):**
```json
{ "email": "company@example.com" }
```

**Proxies to:** `POST ${backend}/logistics/link` with body:
```json
{ "companyEmail": "company@example.com", "shopEmail": "<shop email resolved via Shop.all>" }
```
The frontend only sends `email`; the shop email is resolved server-side. Any `shop` field in the request body is unused.

**Response:** backend-defined.

---

### POST /api/verifyOtp

**Called by:** `OtpStep.jsx`

**Purpose:** Verify OTP and get associated companies (link-existing flow).

**Request body (from frontend):**
```json
{
  "email": "company@example.com",
  "otp": "123456",
  "challengeId": "<challenge id from sendOtp response>"
}
```

**Proxies to:** `POST ${backend}/logistics/link/verify` with body `{ companyEmail, otp, challengeId }`. Uses `challengeId` (not `shop`).

**Response:** backend-defined.

---

## Account Registration API

### POST /api/registercompany

**Called by:** `CreateAccountForm.jsx`

**Purpose:** Register the selected company + sales channel for the new-account flow.

**Request body:** `company` and `saleschannel` (objects):
```json
{
  "company": { "companyId": 123, "name": "My New Company" },
  "saleschannel": { "id": "app-id-123", "name": "Shopify Store" }
}
```

**Proxies to:** `POST ${backend}/logistics/companies/register` with `{ company, saleschannel }`.

---

## Create-New Email-OTP Gate APIs

The create-new flow is gated behind a separate email-OTP verification (distinct from the link-existing OTP). All proxy to `${backend}/logistics/email/*`.

### POST /api/email/send-otp

**Request body:** `{ "email": "owner@example.com" }` → `POST ${backend}/logistics/email/send-otp`.

### POST /api/email/verify-otp

**Request body:** `{ "email", "otp", "challengeId" }` → `POST ${backend}/logistics/email/verify-otp`.

### POST /api/email/reset-verification

Empty body → `POST ${backend}/logistics/email/reset-verification`. Resets the email verification state.

### GET /api/email/verification-status

Proxies to `GET ${backend}/logistics/email/verification-status`. The response is merged with the resolved `shopEmail`.

---

## Location Management APIs

### POST /api/createFyndLocation

**Called by:** Location management components

**Purpose:** Create a new Fynd warehouse location from a Shopify location.

**Request body:**
```json
{
  "shop": "my-store.myshopify.com",
  "shopifyLocationId": "loc-123",
  "address": { "pincode": "400001", "city": "Mumbai" }
}
```

---

### POST /api/idVerification

**Called by:** Location setup

**Purpose:** Verify a Shopify location ID.

---

## Billing APIs

### GET /api/plan

**Called by:** Plan status components

**Purpose:** Get current plan info including usage.

**Behavior:** Pass-through proxy of `GET ${backend}/logistics/plan?shop=<session.shop>`. The response shape is backend-defined (plan tier + usage/limits are computed and enforced in `shopify-backend`).

---

### POST /api/subscription

**Called by:** `UserHandle.jsx`

**Purpose:** Check subscription status (same as Promise app).

---

### GET /api/billing

**Called by:** Pricing page

**Purpose:** Get billing plan options with Shopify confirmation URLs.

**Behavior:** For each configured plan, calls Shopify's `billing.request()` directly (not a backend proxy) and returns the results.

**Response shape:**
```json
{ "messagee": "success", "data": [ /* Shopify billing.request results */ ] }
```
> Note: the success key is literally `messagee` (a typo in the code), not `message`.

---

## Sync APIs

### GET /api/sync/status

**Called by:** Settings

**Purpose:** Check product sync status.

---

### POST /api/sync/products

**Called by:** Settings

**Purpose:** Trigger product sync.

---

## Theme/Extension APIs

### GET /api/themes

**Called by:** Setup completion step

**Purpose:** Check which Shopify theme is active (for extension activation guidance).

---

## Config & Misc APIs

### GET /api/location-pincode/:pincode

**Purpose:** Look up serviceability/details for a pincode.

**Proxies to:** `GET ${backend}/logistics/locations/pincode/<pincode>?shop=<session.shop>`.

### POST /api/configdetails

**Purpose:** Fetch merchant config.

**Behavior:** Body ignored; proxies to `GET ${backend}/logistics/config?shop=<session.shop>`.

### GET /api/magic-link

**Purpose:** Get a deep-link into the Fynd platform.

**Proxies to:** `GET ${backend}/logistics/magic-link?shop=<session.shop>&type=<type>` (`type` from `req.query.type`, defaults to `home`).

### POST /api/updateConfig

**Purpose:** Update merchant config.

**Proxies to:** `POST ${backend}/config/merchant` with `{ shop: <session.shop>, ...req.body }`.

---

## Admin UI Extension API Calls

These are called from the extensions (`fullfillment-extension`, `order-fullfilment`, `fynd-promise-checkout`) directly to `shopify-backend`.

> The previously documented `GET .../fulfillment-status` and `POST /logistics/fulfill/orders/:orderId` endpoints **do not exist**. The real extension endpoints are listed below.

### GET /logistics/fulfill/orders/:orderId/fulfillment-orders

**Called by:** `fullfillment-extension/BlockExtension.jsx`, `order-fullfilment/ActionExtension.jsx`

**Returns:** the order's fulfillment orders and their current status.

### POST /logistics/fulfill/fulfillment

**Called by:** `fullfillment-extension/BlockExtension.jsx`

Triggers a single-order fulfillment. Also used for retry.

### POST /logistics/fulfill/orders/bulk

**Called by:** `order-fullfilment/OrdersIndexExtension.jsx` (order-index bulk action), `order-fullfilment/ActionExtension.jsx`

Triggers fulfillment for multiple orders.

### POST /logistics/fulfill/fulfillment/carrier-assignment-status

**Called by:** `BlockExtension.jsx`, `ActionExtension.jsx`, `OrdersIndexExtension.jsx`

Polled to resolve carrier-assignment state after a fulfillment is created.

### GET /logistics/orders/:orderId/fulfillments/return-eligibility

**Called by:** `ReturnBlockExtension.jsx` (includes `?shop=` query param)

### POST /logistics/returns

**Called by:** `ReturnBlockExtension.jsx`

Creates returns. The body is built from the per-fulfillment `returnQuantities` state and may process **multiple** returns in one call (the response carries success/failed counts) — it is not a single-item body.

### POST /logistics/returns/carrier-assignment-status

**Called by:** `ReturnBlockExtension.jsx`

Polled to resolve carrier-assignment state for created returns.

### POST /logistics/shipments/documents

**Called by:** `order-fullfilment/PrintShipLabelActionExtension.jsx`

Fetches shipping labels / documents.

### POST /logistics/promise/check

**Called by:** `fynd-promise-checkout/Checkout.jsx`

Checks the delivery promise for a checkout cart line.
