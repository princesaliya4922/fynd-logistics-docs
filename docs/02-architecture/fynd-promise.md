---
title: Fynd Promise Architecture
sidebar_position: 3
---

# Fynd Promise Architecture (shopify-pincode-checker)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## Overview

Fynd Promise is composed of three parts:
1. **Admin app** — React SPA embedded in Shopify Admin, for merchant configuration
2. **Checkout UI Extension** — shown to customers during checkout
3. **Theme Extension (PDP widget)** — shown to customers on product pages

All three communicate with the `shopify-backend` for data.

---

## Admin App (React SPA)

### Architecture

```
web/frontend/index.jsx         ← React root, initializes i18n
    └── App.jsx                ← Providers setup + nav menu
        ├── PolarisProvider    ← Shopify UI theme
        ├── AppBridgeProvider  ← Shopify Admin context
        ├── QueryProvider      ← React Query cache
        └── Routes.jsx         ← File-based routing
            ├── /              → pages/index.jsx
            ├── /settings      → pages/settings.jsx
            └── /pricing       → pages/pricing.jsx
```

### Page Flow

Every page renders `RegionHandle` first:

```
RegionHandle
  ├── Calls GET /api/shop
  ├── Checks country_code === 'IN'
  └── if NOT India: show "region not supported" image
  └── if India: render UserHandle

UserHandle
  ├── Calls POST /api/subscription
  ├── if no active subscription: show PromotionalWidget → BillingPage
  └── if active subscription: show NewSetting (settings component)

NewSetting
  ├── Calls GET /api/locations
  ├── if not registered: show DeliveryWidget (onboarding)
  └── if registered: show StepProgress (configured state)
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `RegionHandle` | `components/RegionHandle.jsx` | India-only gate |
| `UserHandle` | `components/UserHandle.jsx` | Subscription + routing |
| `NewSetting` | `components/setting/index.jsx` | Main settings page |
| `DeliveryWidget` | `components/setting/DeliveryWidget.jsx` | Onboarding widget |
| `StepProgress` | `components/setting/StepProgress.jsx` | Progress tracker |
| `BillingPage` | `components/billing/index.jsx` | Subscription page |
| `Pricing` | `components/billing/Pricing.jsx` | Plan selection |

### State Management

- **React Query** — server state caching for API responses
- **useState/useEffect** — local component state
- No global state library (unlike Logistics app)

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuthenticatedFetch` | Wraps fetch with Shopify session token auth |
| `useAppQuery` | React Query wrapper for authenticated GET requests |
| `usePlanManagement` | Handles billing plan operations |

---

## Backend Mini-Server (`web/index.js`)

The Promise app has its own thin Express server that:
- Handles Shopify OAuth (`/api/auth`, `/api/auth/callback`)
- Serves the React SPA
- Proxies all `/api/*` calls to `shopify-backend`
- Manages SQLite sessions

**Session storage:** `@shopify/shopify-app-session-storage-sqlite`
- Database file: `web/database.sqlite` (auto-created)
- No setup required

**On install** (`fyndIntegration.js`):
1. Checks if store country is India
2. Calls `shopify-backend/config/register` with store details
3. Creates webhooks pointing to `shopify-backend/webhook/store/:shop/:topic`

---

## Checkout UI Extension (`fynd-promise-checkout`)

### Configuration

```toml
# extensions/fynd-promise-checkout/shopify.extension.toml
api_version = "2025-04"
type = "ui_extension"
target = "purchase.checkout.cart-line-item.render-after"
export = "cartLineItems"

[capabilities]
api_access = true      # Storefront API access
network_access = true  # External HTTP calls allowed
block_progress = true  # Can block checkout advancement
```

### What It Does

The checkout extension renders after each cart line item and:

1. Shows a pincode input field to the customer
2. On pincode submission (6-digit, starts with 1-9):
   - Validates format client-side
   - Calls `shopify-backend/location/service` with `{ shop, pincode, products }`
3. On successful response:
   - Displays: "Delivery by [date range]"
   - Stores the promise in checkout attributes
   - Adds a note with the chosen delivery partner
4. If pincode is unserviceable and `block_progress = true`:
   - Prevents the customer from advancing to payment

### i18n

Locales in `extensions/fynd-promise-checkout/locales/`:
- `en.default.json` — English
- `fr.json` — French

---

## Theme Extension (`fynd-promise-pdp`)

### Configuration

```toml
# extensions/fynd-promise-pdp/shopify.extension.toml
type = "theme"
name = "Fynd Promise PDP"
```

### What It Does

A JavaScript file (`assets/pincodeService.js`) injected into the merchant's storefront theme:

1. **Renders** a pincode input on the product page
2. **Disables** "Add to Cart" / "Buy Now" buttons until pincode is checked
3. **Calls** `shopify-backend/location/service` with pincode + product ID
4. **Shows** delivery promise message below the input
5. **Persists** the promise in `sessionStorage` so it survives page navigation
6. **Handles** product variant changes (re-checks serviceability on variant switch)

This extension must be **activated** by the merchant in Shopify Admin → Online Store → Themes → Customize → App Blocks.

---

## Data Flow: Customer Checks Pincode

```
Customer on PDP
    ↓
Types pincode in PDP widget (pincodeService.js)
    ↓
POST https://shopify-backend.extensions.fynd.com/location/service
  body: { shop, pincode, productId, variantId }
    ↓
shopify-backend:
  1. Looks up store config in MongoDB (stores collection)
  2. Looks up warehouse mapping (storeMappings collection)
  3. Calls Fynd Serviceability API with pincode + warehouse data
    ↓
Returns: { serviceable: true/false, promiseDate: "Mon–Wed" }
    ↓
Widget shows: "Delivery by Mon–Wed" or "Delivery not available"
```

---

## App Configuration Files

| File | Purpose |
|------|---------|
| `shopify.app.toml` | Production app config (client_id, scopes, webhooks, redirect URLs) |
| `shopify.app.fynd-promise-testing.toml` | Testing environment config |
| `shopify.app.promise-sit.toml` | SIT environment config |
| `shopify.app.promise-dev-10.toml` | Dev-10 environment config |
| `shopify.app.pincode-serviceability-test.toml` | Serviceability test config |

**Required OAuth Scopes:**
```
read_inventory, read_locations, read_orders, read_products,
read_script_tags, read_themes, write_orders, write_products, write_script_tags
```
