---
title: Local Setup — Fynd Promise
sidebar_position: 3
---

# Local Setup: shopify-pincode-checker (Fynd Promise)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

Fynd Promise lives at `services/shopify-pincode-checker` inside the **`shopify-apps` monorepo**. The service itself contains a Node.js/Express mini-server, a React frontend, and two Shopify extensions.

> **Before you start:** Make sure the central Fynd backend (`BACKEND_URL`) is running. The frontend app proxies most API calls to it.

---

## 1. Clone the Repository

The app is no longer a standalone repo — clone the single `shopify-apps` monorepo and `cd` into the service:

```bash
git clone <repo-url>/shopify-apps.git
cd shopify-apps/services/shopify-pincode-checker
```

---

## 2. Install Dependencies

The project uses npm workspaces with three packages: root, `web`, and `web/frontend`.

```bash
# Install all workspace dependencies from root
npm install
```

---

## 3. Configure Environment Variables

There is **no `web/.env.example`** in this repo — create `web/.env` manually:

```bash
# Shopify app credentials (consumed by the Shopify SDK, not by convict)
SHOPIFY_API_KEY=<your-promise-app-api-key>
SHOPIFY_API_SECRET=<your-promise-app-api-secret>

# Your ngrok / app base URL
HOST=https://abc123.ngrok-free.app

# Central Fynd backend URL (proxy target)
BACKEND_URL=https://abc123.ngrok-free.app

# API key for backend authentication
BASE_API_KEY=<same key the backend expects>

# Sentry DSN (optional; read via convict)
SENTRY_DSN=<your-sentry-dsn>

# Port the Express server binds to.
# PORT is the canonical convict var; index.js also reads BACKEND_PORT
# and falls back to PORT, then 3000.
PORT=3000

NODE_ENV=development
```

**Env var notes** (`web/config.js` uses [convict]):

| Var | Read by | Notes |
|-----|---------|-------|
| `NODE_ENV` | convict | App environment |
| `PORT` | convict | Canonical port var |
| `BACKEND_PORT` | `index.js` directly | Takes precedence over `PORT` if set; falls back to `PORT`, then `3000` |
| `HOST` | convict | App base URL |
| `BACKEND_URL` | convict | Central Fynd backend (proxy target) |
| `SENTRY_DSN` | convict | Sentry error reporting |
| `BASE_API_KEY` | convict | Backend API key (`x-api-key`) |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | Shopify SDK | Not part of the convict schema |

> `FRONTEND_PORT` is **not** referenced by the backend config; it is not needed for the Express server.

---

## 4. Start the Development Server

```bash
npm run dev
```

This uses the Shopify CLI to start the app. It will:
1. Start the Express backend on port 3000
2. Build and serve the React frontend with Vite HMR on port 3001
3. Open the Shopify CLI dashboard where you can select a development store

When prompted, select **Use existing dev store** and choose your Shopify development store.

---

## 5. Install the App on Your Dev Store

The Shopify CLI will print an install URL like:
```
https://<your-store>.myshopify.com/admin/oauth/authorize?client_id=...
```

Open it in your browser and click **Install app**. This triggers the OAuth flow:
1. Shopify redirects to `/api/auth`
2. The app gets an access token
3. `fyndIntegration.js` registers the store with the Fynd backend
4. You're redirected to the app dashboard

---

## 6. Configure the Extensions

The app has two Shopify extensions:

**fynd-promise-checkout** (Checkout UI Extension):
```bash
cd extensions/fynd-promise-checkout
npm install
```

**fynd-promise-pdp** (Theme Extension):
- No additional setup needed
- Activate via Shopify Admin → Online Store → Themes → Customize → App blocks (the block is named **"Fynd Pincode Service"**)

---

## 7. Deploy Extensions for Testing

Checkout UI extensions cannot be previewed in development without being deployed:

```bash
npm run deploy -- --source-control-url ""
```

Or use the Shopify CLI:
```bash
shopify app deploy
```

---

## Understanding the App Structure

```
services/shopify-pincode-checker/
├── web/                    # Node.js Express server + React frontend
│   ├── index.js           # Express server (thin proxy to BACKEND_URL)
│   ├── shopify.js         # Shopify API initialization, SQLite sessions
│   ├── config.js          # Environment config (convict)
│   ├── fyndIntegration.js # Registers store + creates webhooks on install
│   ├── billing.js         # Shopify billing plan definitions
│   ├── sentry.js          # Sentry initialization
│   ├── logger.js          # Winston logger
│   ├── privacyPolicy.js   # Static privacy-policy HTML served at /privacy-policy
│   ├── database.sqlite    # SQLite session store (auto-created)
│   └── frontend/          # React SPA (Vite + Polaris)
│       ├── App.jsx
│       ├── pages/         # index, settings, pricing, pagename, ExitIframe, NotFound
│       └── components/    # RegionHandle, UserHandle, setting/*, billing/*
├── extensions/
│   ├── fynd-promise-checkout/  # Checkout UI extension
│   └── fynd-promise-pdp/       # Theme extension (PDP widget / "Fynd Pincode Service")
└── shopify.app.toml            # App config
```

---

## Session Storage

This app uses **SQLite** for session storage (not Redis). The database file is created automatically at `web/database.sqlite` when the app first runs. No setup needed.

---

## Useful Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start Shopify CLI dev mode |
| `npm run build` | Build the app |
| `npm run deploy` | Deploy app + extensions to Shopify |
| `npm run dev:deploy` | Run `localUtils/deploy.sh` (scripted deploy helper) |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run Jest with coverage |
| `npm run ngrok` | Start ngrok tunnel manually |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| "Store not in India" error | Make sure your dev store country is set to India in Shopify Admin |
| Webhook not received | ngrok must be running; check `HOST` env var |
| Subscription check fails | `BACKEND_URL` must point to the running central Fynd backend |
| Blank page after install | Check browser console for `SHOPIFY_API_KEY` mismatch |
| SQLite error | Delete `web/database.sqlite` and reinstall the app |
