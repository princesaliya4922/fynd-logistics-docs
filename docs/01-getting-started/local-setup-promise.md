---
title: Local Setup — Fynd Promise
sidebar_position: 3
---

# Local Setup: shopify-pincode-checker (Fynd Promise)

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

`shopify-pincode-checker` is the Shopify app for **Fynd Promise**. It's a monorepo containing a Node.js/Express mini-server, a React frontend, and two Shopify extensions.

> **Before you start:** Make sure `shopify-backend` is running. The frontend app proxies most API calls to it.

---

## 1. Clone the Repository

```bash
git clone <repo-url>/shopify-pincode-checker.git
cd shopify-pincode-checker
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

```bash
cp web/.env.example web/.env
```

Edit `web/.env`:

```bash
# Shopify app credentials (from Shopify Partners dashboard)
SHOPIFY_API_KEY=<your-promise-app-api-key>
SHOPIFY_API_SECRET=<your-promise-app-api-secret>

# Your ngrok URL (must match HOST in shopify-backend)
HOST=https://abc123.ngrok-free.app

# shopify-backend URL
BACKEND_URL=https://abc123.ngrok-free.app

# API key for backend authentication
BASE_API_KEY=<same as BASE_API_KEY in shopify-backend>

# Ports
BACKEND_PORT=3000
FRONTEND_PORT=3001

NODE_ENV=development
```

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
- Activate via Shopify Admin → Online Store → Themes → Customize → App blocks

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
shopify-pincode-checker/
├── web/                    # Node.js Express server + React frontend
│   ├── index.js           # Express server (thin proxy to shopify-backend)
│   ├── shopify.js         # Shopify API initialization, SQLite sessions
│   ├── config.js          # Environment config (convict)
│   ├── fyndIntegration.js # Registers store + creates webhooks on install
│   ├── billing.js         # Shopify billing plan definitions
│   └── frontend/          # React SPA (Vite + Polaris)
│       ├── App.jsx
│       ├── pages/         # index, settings, pricing
│       └── components/    # RegionHandle, UserHandle, setting/*, billing/*
├── extensions/
│   ├── fynd-promise-checkout/  # Checkout UI extension
│   └── fynd-promise-pdp/       # Theme extension (PDP widget)
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
| `npm test` | Run Jest tests |
| `npm run ngrok` | Start ngrok tunnel manually |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| "Store not in India" error | Make sure your dev store country is set to India in Shopify Admin |
| Webhook not received | ngrok must be running; check `HOST` env var |
| Subscription check fails | `BACKEND_URL` must point to running `shopify-backend` |
| Blank page after install | Check browser console for `SHOPIFY_API_KEY` mismatch |
| SQLite error | Delete `web/database.sqlite` and reinstall the app |
