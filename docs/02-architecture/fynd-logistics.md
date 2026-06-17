---
title: Fynd Logistics Architecture
sidebar_position: 4
---

# Fynd Logistics Architecture (shopify-logistics-app)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## Overview

Fynd Logistics connects Shopify orders to Fynd's fulfillment network. It's more complex than the Promise app due to:
- A multi-step account setup flow (link existing OR create new)
- OTP-based account linking
- Jotai atomic state management
- A richer Admin UI Extension (order details + returns)
- Redis-based session storage

---

## Admin App (React SPA)

### Architecture

```
web/frontend/index.jsx         ← React root, initializes i18n
    └── App.jsx                ← Providers + nav
        ├── PolarisProvider
        ├── AppBridgeProvider
        ├── QueryProvider
        └── Routes.jsx  (file-based routing from web/frontend/pages/)
            ├── /              → pages/index.jsx
            ├── /settings      → pages/settings.jsx
            ├── /pricing       → pages/pricing.jsx
            ├── /pagename      → pages/pagename.jsx
            ├── /ExitIframe    → pages/ExitIframe.jsx
            └── *              → pages/NotFound.jsx (catch-all)
```

> Routes are generated from files in `web/frontend/pages/`. In addition to the three main pages above, the directory also contains `pagename.jsx`, `ExitIframe.jsx` (OAuth iframe escape), and `NotFound.jsx` (404 catch-all).

### State Architecture (Jotai)

The logistics app uses **Jotai** for atomic global state — unlike the Promise app which uses local state + React Query.

```
web/frontend/store/
├── navigationManager.js    ← current view + navigation history
├── companyAtoms.js         ← selected company, sales channel, loading states
├── logisticsAtom.js        ← email for OTP flow, current view/step
├── setupAtoms.js           ← locations, delivery preferences
├── planAtoms.js            ← billing plan + subscription state
└── apiAtoms.js             ← cached API responses
```

**Navigation views (from `navigationManager.js`):** the `VIEWS` constant values are kebab-case strings:
- `PROMOTIONAL` (`'promotional'`) — Shown to new merchants before setup
- `CREATE_NEW` (`'create-new'`) — Create a new Fynd company account (email-OTP gated)
- `LINK_EXISTING` (`'link-existing'`) — Link an existing Fynd account via OTP
- `EXISTING_SETUP` (`'existing-setup'`) — View/edit existing configuration
- `SUCCESS` (`'success'`) — Setup complete confirmation

**Link Existing steps (`LINK_STEPS`):**
- `EMAIL` (`'email'`) — Enter company email
- `OTP` (`'otp'`) — Verify OTP
- `COMPANY_SELECTION` (`'company-selection'`) — Pick company **and** sales channel

> There is no separate "sales channel" step — sales-channel selection is part of the `COMPANY_SELECTION` step.

### Component Tree

```
RegionHandle (country_code === 'IN' check)
    └── UserHandle (master coordinator)
        ├── fetches: /api/locations, /api/getcompanies, /api/getsaleschannel
        ├── reads from Jotai atoms for current view
        └── renders based on navigationManager view:
            ├── PROMOTIONAL → PromotionalWidget
            ├── LINK_EXISTING →
            │   ├── EmailStep    (sendOtp)
            │   ├── OtpStep      (verifyOtp)
            │   └── CompanySelection + SalesChannelSelection
            ├── CREATE_NEW →
            │   └── CreateAccountForm (or simplified setup)
            ├── EXISTING_SETUP →
            │   └── FyndExistingSetup
            └── SUCCESS →
                └── FyndSuccessSetup
```

### Key Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useLogisticsApi` | `utils/apiClient.js` | Authenticated API client — sends `Authorization: Bearer <session token>`, auto-retries once on 401/403 with a fresh token |
| `useEmailVerification` | `hooks/useEmailVerification.js` | Backs the create-new email-OTP gate (send/verify/reset/status) |
| `useOTPVerification` | `hooks/useOTPVerification.js` | OTP verification logic |
| `useOtpFlow` | `hooks/useOtpFlow.js` | Combined send + verify OTP flow |
| `useOTPInput` | `hooks/useOTPInput.js` | OTP input field management |
| `useResendTimer` | `hooks/useResendTimer.js` | Countdown timer for OTP resend |
| `useViewNavigation` | `hooks/useViewNavigation.js` | Navigate between setup views |
| `useLocationData` | `hooks/useLocationData.js` | Fetch and format location data |
| `usePlanStatus` | `hooks/usePlanStatus.js` | Subscription plan status |
| `usePlanManagement` | `hooks/usePlanManagement.js` | Billing plan changes + navigation to plan selection |
| `useAppQuery` | `hooks/useAppQuery.js` | React Query wrapper over `useAuthenticatedFetch` |
| `useAuthenticatedFetch` | `hooks/useAuthenticatedFetch.js` | App Bridge auth-aware `fetch` with reauthorization handling |
| `useToast` | `hooks/useToast.js` | Toast notification helpers (success/error/info/warning) |

---

## Backend Mini-Server

Similar to the Promise app but:
- Uses **Redis** for session storage (via `@shopify/shopify-app-session-storage-redis`, configured in `web/shopify.js`)
- Session key prefix: `shopify_logistics_session_`
- Redis connection string comes from the `REDIS_SHOPIFY_BACKEND_READ_WRITE` env var (`web/config.js`)
- On `APP_UNINSTALLED` webhook → deletes all Redis sessions for that shop

**On install** (`fyndIntegration.js`):
The store is registered with the backend and the following webhooks are created. All Fynd webhooks are registered with the `?app=fynd-logistics` query suffix and point at `${FYND_EXTERNAL_URL}/webhook/store/{shop}/{topic}`.

**REST / Admin API topics** (Shopify Admin API version `2024-10`):
- `inventory_levels/update`
- `locations/create`
- `locations/update`
- `orders/create`
- `app/uninstalled`
- `app_subscriptions/update`
- `fulfillments/create`
- `fulfillments/update`
- `products/update`

**GraphQL subscription topics:**
- `returns/cancel`
- `returns/request`
- `returns/approve`
- `returns/decline`

**Dual uninstall registration:** In addition to the REST `app/uninstalled` webhook above, a **separate** `app/uninstalled` webhook is registered pointing at `${frontendUrl}/api/webhooks` (the frontend mini-server's handler that clears Redis sessions). This second registration does **not** carry the `?app=fynd-logistics` suffix.

---

## Admin UI Extensions

### fullfillment-extension (Order Details Block)

**Config:**
```toml
target = "admin.order-details.block.render"
```

**`BlockExtension.jsx`:**
- Renders on the Shopify Admin order details page
- Reads fulfillment orders via `GET /logistics/fulfill/orders/:orderId/fulfillment-orders`
- Triggers a single-order fulfillment via `POST /logistics/fulfill/fulfillment`
- Polls carrier-assignment status via `POST /logistics/fulfill/fulfillment/carrier-assignment-status`
- Displays Fynd shipment status, AWB number, tracking info

**`ReturnBlockExtension.jsx`:**
- Second block on the same page
- Checks return eligibility via `GET /logistics/orders/:orderId/fulfillments/return-eligibility`
- Creates returns via `POST /logistics/returns`
- Polls return carrier-assignment status via `POST /logistics/returns/carrier-assignment-status`

> There is also a separate **`order-fullfilment`** extension containing three action extensions (`ActionExtension.jsx`, `OrdersIndexExtension.jsx`, `PrintShipLabelActionExtension.jsx`) used for the order-details action, bulk fulfillment from the order index, and shipping-label printing. Plus the logistics app ships the storefront-facing `fynd-promise-checkout` (checkout UI) and `fynd-promise-pdp` (theme app) extensions. See [Local Setup — Fynd Logistics](../01-getting-started/local-setup-logistics.md) and the Shopify extensions reference for details.

---

## Setup Flow Deep Dive

### Link Existing Account (most common)

```
Merchant enters company email
    ↓
POST /api/sendOtp  { email }
  → proxies to ${backend}/logistics/link
    with { companyEmail: email, shopEmail }  (shopEmail resolved via Shop.all)
    ↓
Merchant enters OTP (resend timer)
    ↓
POST /api/verifyOtp  { email, otp, challengeId }
  → proxies to ${backend}/logistics/link/verify
    with { companyEmail, otp, challengeId }
    ↓
Merchant selects Company (POST /api/getcompanies → GET ${backend}/logistics/companies?shop=…)
    ↓
Merchant selects Sales Channel (POST /api/getsaleschannel { company } → GET ${backend}/logistics/companies/{company}/saleschannels?shop=…)
    ↓
FyndSetup form:
  - Configure warehouse locations (from /api/locations)
  - Set processing time / delivery promise / shipping preferences
    ↓
POST /api/updateSetup  → HTTP PUT ${backend}/logistics/setup?shop=…
  (the backend persists the setup; MongoDB writes are backend-owned)
    ↓
FyndSuccessSetup screen
```

### Create New Account

```
Merchant clicks "Create New Account"
    ↓
Email-OTP gate (POST /api/email/send-otp → /api/email/verify-otp)
    ↓
CreateAccountForm: collect company + sales channel
    ↓
POST /api/registercompany  { company, saleschannel }
  → POST ${backend}/logistics/companies/register
    ↓
Proceed to FyndSetup (same as above)
```

---

## App Configuration Files

| File | App | Environment | webhooks `api_version` |
|------|-----|------------|------------------------|
| `shopify.app.toml` | **Fynd Promise** (`name = "Fynd Promise"`, `handle = "fynd-promise"`) | default config in this repo | `2025-10` |
| `shopify.app.fynd-logistics-dev-devx.toml` | `fynd-logistics-dev-devx` | Development (DevX) | `2026-01` |
| `shopify.app.fynd-logistics-uat.toml` | `fynd-logistics-uat` | UAT | `2026-01` |
| `shopify.app.fynd-logistics-prod.toml` | **Fynd Ship** (`name = "Fynd Ship"`) | Production | `2026-01` |

> **Naming caveat:** The default `shopify.app.toml` in this directory is actually the **Fynd Promise** config (it carries `client_id`, `name = "Fynd Promise"`, `handle = "fynd-promise"`), not a logistics config. The production logistics app is published under the name **"Fynd Ship"** (`shopify.app.fynd-logistics-prod.toml`). There is **no** `shopify.app.fynd-logistics.toml` or `shopify.app.fynd-logistics-dev.toml`.

**Required OAuth Scopes:**
```
read_assigned_fulfillment_orders, read_customers, read_inventory,
read_locations, read_merchant_managed_fulfillment_orders,
read_order_edits, read_orders, read_products, read_returns,
read_script_tags, read_themes, read_third_party_fulfillment_orders,
write_assigned_fulfillment_orders, write_fulfillments, write_inventory,
write_merchant_managed_fulfillment_orders, write_orders,
write_products, write_returns, write_script_tags,
write_third_party_fulfillment_orders
```

All logistics configs (dev/uat/prod) additionally include `read_customer_merge`. The production config (`shopify.app.fynd-logistics-prod.toml`) sets the webhook `api_version` to `2026-01`.

Note: Logistics app requests significantly more scopes than Promise app, reflecting its deeper order and fulfillment management capabilities.
