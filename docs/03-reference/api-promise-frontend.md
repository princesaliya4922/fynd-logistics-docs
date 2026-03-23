---
title: Promise App API Calls
sidebar_position: 6
---

# Fynd Promise Frontend API Calls

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

All API calls made by the `shopify-pincode-checker` React frontend to its own backend server, which proxies them to `shopify-backend`.

---

## Authentication

All frontend API calls use the `useAuthenticatedFetch` hook:

```javascript
const authenticatedFetch = useAuthenticatedFetch()
// Adds: Authorization: Bearer <shopify_session_token>
```

---

## Endpoint Reference

### GET /api/shop

**Called by:** `RegionHandle.jsx`

**Purpose:** Fetch Shopify store details to check if store is in India.

**Response:**
```json
{
  "shop": {
    "name": "My Store",
    "email": "merchant@example.com",
    "country_code": "IN",
    "domain": "my-store.myshopify.com",
    "currency": "INR"
  }
}
```

**Usage:** `country_code` is checked. If not `"IN"`, the app shows an "outside region" error.

---

### POST /api/subscription

**Called by:** `UserHandle.jsx`

**Purpose:** Check current subscription status for this store.

**Response:**
```json
{
  "active": true,
  "plan": "Free",
  "ordersUsed": 23,
  "orderLimit": 50,
  "subscriptionId": "gid://shopify/AppSubscription/1234"
}
```

**Usage:** If `active === false`, merchant is redirected to the billing/pricing page.

---

### GET /api/locations

**Called by:** `setting/index.jsx` (NewSetting component)

**Purpose:** Get merchant's configured locations and delivery settings.

**Response:**
```json
{
  "data": {
    "result": [
      {
        "id": "shopify-location-id",
        "name": "Main Warehouse",
        "address1": "123 Main St",
        "city": "Mumbai",
        "pincode": "400001"
      }
    ],
    "deliveryPreference": "standard",
    "promiseView": "range"
  },
  "boarding": false
}
```

**Usage:** `boarding: false` means merchant is NOT yet set up (`DeliveryWidget` shown). `boarding: true` means they're configured (`StepProgress` shown).

---

### POST /api/updateConfig

**Called by:** Settings components after merchant updates configuration.

**Purpose:** Save merchant delivery configuration.

**Request body:**
```json
{
  "deliveryPreference": "standard",
  "promiseView": "range",
  "locationId": "shopify-location-id",
  "processingTime": 1
}
```

---

### POST /api/idVerification

**Called by:** Location setup flow.

**Purpose:** Verify a Shopify location ID against the Fynd backend.

**Request body:**
```json
{ "locationId": "shopify-location-id", "shop": "my-store.myshopify.com" }
```

---

### GET /api/themes

**Called by:** Theme setup component.

**Purpose:** Fetch available Shopify themes to guide PDP extension setup.

**Response:**
```json
{
  "themes": [
    { "id": 123, "name": "Dawn", "role": "main" }
  ]
}
```

---

### GET /api/billing

**Called by:** `billing/index.jsx`

**Purpose:** Get billing plan information and URLs for upgrading.

---

### GET /api/sync/status

**Called by:** Settings components.

**Purpose:** Check product sync status with Fynd backend.

**Response:**
```json
{
  "status": "completed",
  "syncedAt": "2026-03-23T10:00:00Z",
  "productCount": 150
}
```

---

### POST /api/sync/products

**Called by:** Settings — trigger manual product sync.

**Purpose:** Start syncing Shopify products to Fynd backend.

---

## Checkout Extension API Calls

These are called directly from the Shopify checkout context (not via the Express server):

### POST /location/service

**Called by:** `extensions/fynd-promise-checkout/src/Checkout.jsx`

**URL:** Directly to `shopify-backend` (not through the mini Express server)

**Purpose:** Check pincode serviceability + get delivery promise.

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
    "deliveryPartner": "BlueDart"
  }
}
```

## PDP Extension API Calls

### POST /location/service

Same endpoint as Checkout extension — called from `extensions/fynd-promise-pdp/assets/pincodeService.js`.

URL is hardcoded to the `shopify-backend` domain in the theme extension script.
