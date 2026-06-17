---
title: Fynd Promise Architecture
sidebar_position: 3
---

# Fynd Promise Architecture (shopify-pincode-checker)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## Overview

Fynd Promise lives at `services/shopify-pincode-checker` inside the `shopify-apps` monorepo. The admin app is served from its own URL `https://pincode-checker.extensions.fynd.com/` (`shopify.app.toml` → `application_url`).

It is composed of three parts:
1. **Admin app** — React SPA embedded in Shopify Admin, for merchant configuration
2. **Checkout UI Extension** — shown to customers during checkout
3. **Theme Extension (PDP widget)** — shown to customers on product pages

These talk to the central Fynd backend for serviceability/config data, but they reach it two different ways:

- **Admin app** proxies `/api/*` calls to the `BACKEND_URL` env var (`web/config.js`, referenced as `fyndBackendUrl` / `FYND_EXTERNAL_URL` in code). This host is environment-specific and is **not** branded `shopify-backend`.
- **Checkout and PDP extensions** call a hardcoded host `https://shopify-backend.extensions.fynd.com/location/service` directly from the storefront/checkout context. This URL is baked into the extension source, independent of `BACKEND_URL`.

---

## Admin App (React SPA)

### Architecture

```
web/frontend/index.jsx         ← React root, initializes i18n
    └── App.jsx                ← Providers setup + nav menu
        ├── PolarisProvider    ← Shopify UI theme
        ├── AppBridgeProvider  ← Shopify Admin context
        ├── QueryProvider      ← React Query cache
        └── Routes.jsx         ← File-based routing (web/frontend/Routes.jsx)
            ├── /              → pages/index.jsx
            ├── /settings      → pages/settings.jsx
            ├── /pricing       → pages/pricing.jsx
            ├── /pagename      → pages/pagename.jsx
            ├── /ExitIframe    → pages/ExitIframe.jsx
            └── *              → pages/NotFound.jsx
```

> Routing is file-based: every `.jsx` file under `web/frontend/pages/` with a default export becomes a route. The list above is illustrative of the files present today, not a hand-maintained route table.

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
- Proxies all `/api/*` calls to the central Fynd backend (`BACKEND_URL`)
- Manages SQLite sessions

**Session storage:** `@shopify/shopify-app-session-storage-sqlite`
- Database file: `web/database.sqlite` (auto-created)
- No setup required

**On install** (`fyndIntegration.js`, only when `data.country_code === 'IN'`):
1. Fetches store details (`Shop.all`) and the store's domains via a GraphQL `shop { domains { url } }` query
2. Calls `${BACKEND_URL}/config/register` with a payload including `appName: 'fynd-promise'`, `shop`, `token`, `email`, `name`, `shopId` (`gid://shopify/Shop/<id>`), and `domains`
3. Creates webhooks via the Shopify REST Admin API (version `2024-01`) pointing to `${BACKEND_URL}/webhook/store/${shop}/${topic}?app=fynd-promise`

The `?app=fynd-promise` query param identifies the app on the backend's webhook handler and is shared with the GDPR webhooks declared in `shopify.app.toml`.

**Install-time webhook topics** (REST, registered by `createWebhook`):
`inventory_levels/update`, `locations/create`, `locations/update`, `orders/create`, `app/uninstalled`, `app_subscriptions/update`.

**GDPR / compliance webhooks** (declared in `shopify.app.toml`, `[webhooks]` `api_version = "2024-07"`):
`customers/data_request`, `customers/redact`, `shop/redact`. These point at `${BACKEND_URL}/webhook/store/gdpr/:shop/<topic>?app=fynd-promise` (the toml currently hardcodes the `shopify-backend.extensions.fynd.com` host for these compliance URIs).

---

## Checkout UI Extension (`fynd-promise-checkout`)

### Configuration

The toml uses the nested `[[extensions]]` structure (verified in `shopify.app.toml`-adjacent `shopify.extension.toml`). `api_version` is the only top-level key; `handle` lives inside `[[extensions]]`.

```toml
# extensions/fynd-promise-checkout/shopify.extension.toml
api_version = "2025-04"

[[extensions]]
name = "Fynd Promise"
handle = "fynd-promise"
type = "ui_extension"

  [[extensions.targeting]]
  module = "./src/Checkout.jsx"
  target = "purchase.checkout.cart-line-item.render-after"
  export = "cartLineItems"

[extensions.capabilities]
api_access = true      # Storefront API access
network_access = true  # External HTTP calls allowed
block_progress = true  # Can block checkout advancement

# NOTE: the file also contains a stray, uncommented `banner_title`
# setting field (the surrounding [extensions.settings] header is
# commented out) that has no effect.
```

> The logistics app ships its own copy of a Fynd Promise checkout extension; its toml may differ from this one. Treat this snippet as authoritative only for `shopify-pincode-checker`.

### What It Does

The checkout extension renders after **each cart line item** (`useCartLineTarget`). It does **not** render an input field — it only renders a `<Text>` message. It reads the pincode from the buyer's **shipping address** (`useShippingAddress().zip`):

1. Watches `shippingData.zip` and auto-fires when the zip changes, is 6 digits, and `countryCode === 'IN'` (validated with `/^[1-9][0-9]{5}$/`).
2. On a valid pincode, `POST`s to `https://shopify-backend.extensions.fynd.com/location/service` with body `{ data: <cart line target>, shop: <myshopifyDomain>, pincode }`.
3. Consumes the response as `{ status, message, dateRange: { name } }`. On `status === true` it applies an **order note** via `applyNoteChange` of the form:
   `Suggested Delivery Partner: <dateRange.name>,\nExpected Promise: <message>`.
   It does **not** set any checkout attributes.
4. Blocks checkout progress via `useBuyerJourneyIntercept` when `checkData.status === false` (uses `message` as the block reason).

### i18n

Locale files exist in `extensions/fynd-promise-checkout/locales/` (`en.default.json`, `fr.json`) but are **unused scaffolding placeholders** — the displayed English strings are hardcoded in `Checkout.jsx`.

---

## Theme Extension (`fynd-promise-pdp`)

### Configuration

```toml
# extensions/fynd-promise-pdp/shopify.extension.toml
type = "theme"
name = "Fynd Promise PDP"
```

> The extension directory is `fynd-promise-pdp` and the toml `name` is "Fynd Promise PDP", but the **app block merchants actually add** is named **"Fynd Pincode Service"** (the `name` in the `{% schema %}` of `blocks/pincode_service.liquid`).

### What It Does

This is a **theme app block**, not a single injected JS file. It consists of:
- `blocks/pincode_service.liquid` — the block markup, styles, and merchant settings schema
- `snippets/stars.liquid`
- `assets/pincodeService.js` + image assets

Behavior (`pincodeService.js`):

1. **Renders** a pincode input + button on the product page
2. **Disables** a large hardcoded list of buy/checkout buttons (~33 labels in `textsToDisable`, e.g. "add to cart", "buy now") until a serviceable pincode is checked
3. **Calls** `https://shopify-backend.extensions.fynd.com/location/service` with `{ pincode, productId, shop, variantId, sku }`
4. **Consumes** the response as `content.status` (boolean), `content.message`, and `content.dateRange.name`
5. **Shows** the delivery promise message below the input and, on success, writes it as a **cart note** via `POST /cart/update.js`
6. **Persists** the result in `sessionStorage` so it survives page navigation
7. **Handles** product variant changes (re-checks serviceability on variant switch), and short-circuits for variants where `requires_shipping` is false
8. Honors merchant settings such as `allow_checkout_on_empty_or_invalid_pincode`, `allow_checkout_on_unserviceable_pincode`, and `use_custom_pincode_button_text` / `custom_pincode_button_text`, and reads a `shop.metafields.settings.fyndWidget` gating metafield

This extension must be **activated** by the merchant in Shopify Admin → Online Store → Themes → Customize → App Blocks (it appears as "Fynd Pincode Service").

---

## Data Flow: Customer Checks Pincode

```
Customer on PDP
    ↓
Types pincode in PDP widget (pincodeService.js)
    ↓
POST https://shopify-backend.extensions.fynd.com/location/service
  body: { pincode, productId, shop, variantId, sku }
    ↓
Fynd backend (backend-owned):
  resolves store config + warehouse mapping and calls
  the Fynd Serviceability API with pincode + warehouse data
    ↓
Returns: { status: true/false, message: "...", dateRange: { name: "..." } }
    ↓
Widget shows content.message (success/error styled); on success
also writes a cart note via /cart/update.js
```

> The exact backend resolution steps (config/warehouse lookups, serviceability call) are backend-owned and not implemented in this app repo.

---

## App Configuration Files

| File | Purpose |
|------|---------|
| `shopify.app.toml` | Production app config (client_id, scopes, GDPR webhooks, redirect URLs) |
| `shopify.app.fynd-promise-testing.toml` | Testing environment config |
| `shopify.app.pincode-serviceability-test.toml` | Serviceability test config |

**Required OAuth Scopes:**
```
read_inventory, read_locations, read_orders, read_products,
read_script_tags, read_themes, write_orders, write_products, write_script_tags
```
