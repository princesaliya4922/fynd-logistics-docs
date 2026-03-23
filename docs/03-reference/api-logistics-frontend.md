---
title: Logistics App API Calls
sidebar_position: 7
---

# Fynd Logistics Frontend API Calls

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

All API calls made by the `shopify-logistics-app` React frontend.

---

## Authentication

All calls use `useLogisticsApi` hook from `web/frontend/utils/apiClient.js`:

```javascript
const api = useLogisticsApi()
// Adds: Authorization: Bearer <shopify_session_token>
// Auto-retries once on 401/403 with fresh session token
```

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

**Request body:**
```json
{ "shop": "my-store.myshopify.com" }
```

**Response:**
```json
{
  "companies": [
    { "companyId": 123, "name": "My Company", "uid": "UID123" }
  ]
}
```

---

### POST /api/getsaleschannel

**Called by:** `SalesChannelSelection.jsx`

**Purpose:** Fetch sales channels for a selected Fynd company.

**Request body:**
```json
{ "shop": "my-store.myshopify.com", "companyId": 123 }
```

**Response:**
```json
{
  "salesChannels": [
    { "id": "app-id-123", "name": "Shopify Store", "domain": "my-store.myshopify.com" }
  ]
}
```

---

### POST /api/getsetup

**Called by:** `FyndExistingSetup.jsx`

**Purpose:** Fetch current setup configuration for a store.

**Response:**
```json
{
  "companyDetails": { "companyId": 123, "name": "My Company" },
  "salesChannelDetails": { "applicationId": "app-id" },
  "processingTime": { "mode": "common", "value": 1 },
  "shippingPreference": "cheapest",
  "pickupLocations": [...]
}
```

---

### POST /api/updateSetup

**Called by:** `FyndSetup.jsx` on form submit

**Purpose:** Save complete logistics setup configuration.

**Request body:**
```json
{
  "shop": "my-store.myshopify.com",
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

**Purpose:** Send OTP to the merchant's Fynd company email.

**Request body:**
```json
{ "email": "company@example.com", "shop": "my-store.myshopify.com" }
```

**Response:**
```json
{ "success": true, "message": "OTP sent to company@example.com" }
```

---

### POST /api/verifyOtp

**Called by:** `OtpStep.jsx`

**Purpose:** Verify OTP and get associated companies.

**Request body:**
```json
{
  "email": "company@example.com",
  "otp": "123456",
  "shop": "my-store.myshopify.com"
}
```

**Response:**
```json
{
  "success": true,
  "companies": [
    { "companyId": 123, "name": "My Company" }
  ]
}
```

---

## Account Registration API

### POST /api/registercompany

**Called by:** `CreateAccountForm.jsx`

**Purpose:** Create a new Fynd company account.

**Request body:**
```json
{
  "shop": "my-store.myshopify.com",
  "companyName": "My New Company",
  "ownerEmail": "owner@example.com",
  "phone": "+91-9876543210"
}
```

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

**Response:**
```json
{
  "plan": "Free",
  "fulfillmentsUsed": 35,
  "fulfillmentLimit": 50,
  "isLimitReached": false
}
```

---

### POST /api/subscription

**Called by:** `UserHandle.jsx`

**Purpose:** Check subscription status (same as Promise app).

---

### GET /api/billing

**Called by:** Pricing page

**Purpose:** Get billing plan options with Shopify confirmation URLs.

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

## Admin UI Extension API Calls

These are called from `extensions/fullfillment-extension/` directly to `shopify-backend`:

### GET /logistics/fulfill/orders/:orderId/fulfillment-status

**Called by:** `BlockExtension.jsx`

**Returns:** Full shipment status, AWB, tracking URL.

### POST /logistics/fulfill/orders/:orderId

**Called by:** `BlockExtension.jsx` (manual fulfillment trigger)

### GET /logistics/orders/:orderId/fulfillments/return-eligibility

**Called by:** `ReturnBlockExtension.jsx`

### POST /logistics/returns

**Called by:** `ReturnBlockExtension.jsx`

**Request body:**
```json
{
  "shop": "my-store.myshopify.com",
  "orderId": "shopify-order-id",
  "fulfillmentOrderId": "shopify-fo-id",
  "reason": "damaged",
  "items": [{ "lineItemId": "li-id", "quantity": 1 }]
}
```
