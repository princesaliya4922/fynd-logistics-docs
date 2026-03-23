---
title: Fynd Logistics Architecture
sidebar_position: 4
---

# Fynd Logistics Architecture (shopify-logistics-app)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

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
        └── Routes.jsx
            ├── /              → pages/index.jsx
            ├── /settings      → pages/settings.jsx
            └── /pricing       → pages/pricing.jsx
```

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

**Navigation views (from `navigationManager.js`):**
- `PROMOTIONAL` — Shown to new merchants before setup
- `CREATE_NEW` — Create a new Fynd company account
- `LINK_EXISTING` — Link an existing Fynd account via OTP
- `EXISTING_SETUP` — View/edit existing configuration
- `SUCCESS` — Setup complete confirmation

**Link Existing steps:**
- `EMAIL` — Enter company email
- `OTP` — Verify OTP
- `COMPANY_SELECTION` — Pick company + sales channel

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
| `useLogisticsApi` | `utils/apiClient.js` | Authenticated API client with session token + 401 retry |
| `useOTPVerification` | `hooks/useOTPVerification.js` | OTP verification logic |
| `useOtpFlow` | `hooks/useOtpFlow.js` | Combined send + verify OTP flow |
| `useOTPInput` | `hooks/useOTPInput.js` | 6-digit OTP input field management |
| `useResendTimer` | `hooks/useResendTimer.js` | Countdown timer for OTP resend |
| `useViewNavigation` | `hooks/useViewNavigation.js` | Navigate between setup views |
| `useLocationData` | `hooks/useLocationData.js` | Fetch and format location data |
| `usePlanStatus` | `hooks/usePlanStatus.js` | Subscription plan status |

---

## Backend Mini-Server

Similar to the Promise app but:
- Uses **Redis** for session storage (via `@shopify/shopify-app-session-storage-redis`)
- Session key prefix: `shopify_logistics_session_`
- On `APP_UNINSTALLED` webhook → deletes all Redis sessions for that shop

**On install** (`fyndIntegration.js`):
Creates additional webhooks vs. Promise app:
- `fulfillments/create`
- `fulfillments/update`
- `returns/cancel` (GraphQL subscription webhook)

---

## Admin UI Extensions

### fullfillment-extension (Order Details Block)

**Config:**
```toml
target = "admin.order-details.block.render"
```

**`BlockExtension.jsx`:**
- Renders on the Shopify Admin order details page
- Calls `shopify-backend` `/logistics/fulfill/orders/:orderId/fulfillment-status`
- Displays Fynd shipment status, AWB number, tracking info
- Allows triggering fulfillment from the order page

**`ReturnBlockExtension.jsx`:**
- Second block on the same page
- Checks return eligibility via `/logistics/orders/:orderId/fulfillments/return-eligibility`
- Allows merchants to initiate returns from the order page
- Calls `/logistics/returns` to create return

---

## Setup Flow Deep Dive

### Link Existing Account (most common)

```
Merchant enters company email
    ↓
POST /api/sendOtp
  → backend calls Fynd Central: verify email + send OTP
    ↓
Merchant enters OTP (6 digits, 10s resend timer)
    ↓
POST /api/verifyOtp
  → backend calls Fynd Central: verify OTP, return company list
    ↓
Merchant selects Company (from /api/getcompanies)
    ↓
Merchant selects Sales Channel (from /api/getsaleschannel)
    ↓
FyndSetup form:
  - Configure warehouse locations (from /api/locations)
  - Set processing time
  - Set delivery promise view
  - Set shipping preferences
    ↓
POST /api/updateSetup
  → backend saves to MongoDB logistics collection
  → backend calls Fynd Central to link sales channel
    ↓
FyndSuccessSetup screen
```

### Create New Account

```
Merchant clicks "Create New Account"
    ↓
CreateAccountForm: collect company details
    ↓
POST /api/registercompany
  → backend calls Fynd Central to create company
    ↓
Proceed to FyndSetup (same as above)
```

---

## App Configuration Files

| File | Environment |
|------|------------|
| `shopify.app.toml` | Default/production |
| `shopify.app.fynd-logistics.toml` | Production (named) |
| `shopify.app.fynd-logistics-uat.toml` | UAT |
| `shopify.app.fynd-logistics-dev.toml` | Development |

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

Note: Logistics app requests significantly more scopes than Promise app, reflecting its deeper order and fulfillment management capabilities.
