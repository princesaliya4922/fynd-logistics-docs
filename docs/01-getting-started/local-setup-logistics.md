---
title: Local Setup — Fynd Logistics
sidebar_position: 4
---

# Local Setup: shopify-logistics-app (Fynd Logistics)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

`shopify-logistics-app` is the Shopify app for **Fynd Logistics**. Like the Promise app, it has a React frontend, an Express backend, and Shopify extensions — but it uses Redis for sessions and Jotai for state management.

> **Before you start:** Make sure `shopify-backend` is running locally and Redis is available.

---

## 1. Clone the Repository

```bash
git clone <repo-url>/shopify-logistics-app.git
cd shopify-logistics-app
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

```bash
cp web/.env.example web/.env
```

Edit `web/.env`:

```bash
# Shopify app credentials (from Shopify Partners dashboard — logistics app)
SHOPIFY_API_KEY=<your-logistics-app-api-key>
SHOPIFY_API_SECRET=<your-logistics-app-api-secret>

# Your ngrok URL
HOST=https://abc123.ngrok-free.app

# shopify-backend URL
BACKEND_URL=https://abc123.ngrok-free.app

# API key for backend authentication
BASE_API_KEY=<same as BASE_API_KEY in shopify-backend>

# Redis session storage
REDIS_URL=redis://localhost:6379/0

# Ports
BACKEND_PORT=3000
FRONTEND_PORT=3001

NODE_ENV=development

# Sentry (optional locally)
SENTRY_DSN=
```

---

## 4. Start the Development Server

```bash
npm run dev
```

Same as the Promise app — uses Shopify CLI to start backend + frontend simultaneously.

---

## 5. Install the App on Your Dev Store

Follow the same OAuth flow as described in [Local Setup: Promise](./local-setup-promise.md#5-install-the-app-on-your-dev-store).

When installed on a logistics app, `fyndIntegration.js` registers the store with the backend and creates these additional webhooks:
- `fulfillments/create`
- `fulfillments/update`
- `returns/cancel` (GraphQL subscription webhook)

---

## 6. Set Up the Extensions

**fullfillment-extension** (Admin UI Extension — Order Block):
```bash
cd extensions/fullfillment-extension
npm install
```

This extension renders two blocks in the Shopify Admin order details page:
- `BlockExtension.jsx` — Shows Fynd fulfillment status
- `ReturnBlockExtension.jsx` — Handles returns

To preview the extension, you need to deploy it at least once:
```bash
shopify app deploy
```

---

## Understanding the Key Difference vs. Promise App

| Feature | Promise App | Logistics App |
|---------|------------|--------------|
| Session Storage | SQLite (file-based) | Redis |
| State Management | React Context / React Query | Jotai atoms |
| Main user flow | Configure widget settings | Full account setup + location mapping |
| Shopify Extensions | Checkout + Theme (storefront) | Admin UI (order details) |
| Webhooks | Product, inventory, orders | + Fulfillments, returns |
| Account linking | N/A | OTP-based link to Fynd Company |

---

## Understanding the Setup Flow

When a merchant opens the logistics app for the first time, they go through a guided setup:

```
RegionHandle (country_code = IN check)
    ↓
UserHandle (fetches locations, companies, sales channels)
    ↓
PromotionalWidget (if not yet set up)
    ↓
Choose: Link Existing Account  OR  Create New Account
    ↓                                   ↓
EmailStep (enter email)        CreateAccountForm
OtpStep (verify OTP)
    ↓
CompanySelection (choose Fynd company)
    ↓
SalesChannelSelection
    ↓
FyndSetup (configure preferences)
    ↓
FyndSuccessSetup (done!)
```

State for this flow is managed in Jotai atoms in `web/frontend/store/`:
- `navigationManager.js` — current view + history
- `companyAtoms.js` — company/sales channel selection
- `logisticsAtom.js` — OTP flow state
- `setupAtoms.js` — delivery and location preferences

---

## Useful Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start Shopify CLI dev mode |
| `npm run build` | Build the app |
| `npm run deploy` | Deploy to Shopify |
| `npm test` | Run Jest tests |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Redis connection refused | Start Redis: `docker start fynd-redis` or check `REDIS_URL` |
| OTP not received | `shopify-backend` must be running with valid Fynd API credentials |
| Company list empty | Backend must have valid `EXTENSION_API_KEY`/`EXTENSION_API_SECRET` |
| Extension not showing on order page | Deploy extensions first with `shopify app deploy` |
