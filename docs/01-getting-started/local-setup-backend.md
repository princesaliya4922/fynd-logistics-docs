---
title: Local Setup — Backend
sidebar_position: 2
---

# Local Setup: shopify-backend

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

`shopify-backend` is the shared Node.js/Express server that powers both Fynd Promise and Fynd Logistics. Run it first before starting either frontend app.

---

## 1. Clone the Repository

```bash
git clone <repo-url>/shopify-backend.git
cd shopify-backend
```

> **Note:** The repo is hosted on Azure DevOps. Get the clone URL from your team lead.

---

## 2. Install Private npm Packages

The backend depends on two private packages from Azure DevOps:
- `fit` — Fynd's internal server framework (wraps Express, MongoDB, Redis)
- `@gofynd/fdk-client-javascript` — Fynd Platform API client

These are installed automatically when you have a valid Azure DevOps token.

```bash
# Set your Azure DevOps token (base64 encoded PAT)
export AZURE_PRIVATE_TOKEN_BASE64=<your-base64-encoded-token>

# Install dependencies
npm ci --legacy-peer-deps
```

If you see `401 Unauthorized` during install, your token is missing or expired. Contact your team lead.

---

## 3. Configure Environment Variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

Edit `.env` with minimum required values for local development:

```bash
# Server
NODE_ENV=development
PORT=8000

# MongoDB (local Docker or Atlas)
MONGO_SHOPIFY_BACKEND_READ_WRITE=mongodb://localhost:27017/shopify_backend
MONGO_SHOPIFY_BACKEND_READ_ONLY=mongodb://localhost:27017/shopify_backend

# Redis (local Docker or cloud)
REDIS_SHOPIFY_BACKEND_READ_WRITE=redis://localhost:6379/0
REDIS_SHOPIFY_BACKEND_READ_ONLY=redis://localhost:6379/0

# Shopify App Credentials
SHOPIFY_APP__LOGISTICS_API_KEY=<from Shopify Partners>
SHOPIFY_APP__LOGISTICS_API_SECRET=<from Shopify Partners>
SHOPIFY_APP__PROMISE_API_KEY=<from Shopify Partners>
SHOPIFY_APP__PROMISE_API_SECRET=<from Shopify Partners>

# Fynd Platform
EXTENSION_BASE_URL=<fynd backend base URL>
EXTENSION_API_KEY=<fynd extension API key>
EXTENSION_API_SECRET=<fynd extension API secret>

# Admin Panel
BOLTIC_USERNAME=admin
BOLTIC_PASSWORD=<choose a local password>
ADMIN_PANEL_PASSWORD=<choose a local password>

# Optional (leave blank locally)
SENTRY_DSN=
GOOGLE_MAPS_API_KEY=
```

See [Environment Variables Reference](./environment-variables.md) for all variables with descriptions.

---

## 4. Create MongoDB Indexes

```bash
npm run create-indexes
```

This runs `scripts/create-indexes.js` to create all required MongoDB indexes for performance.

---

## 5. Start the Server

```bash
npm run dev
```

The server starts with `nodemon` (hot reload) and the remote debugger on port `9229`.

Expected output:
```
[info] MongoDB connected
[info] Redis connected
[info] Server listening on port 8000
```

---

## 6. Expose via ngrok (Required for Shopify Webhooks)

Shopify needs to reach your local server to send webhooks during development.

```bash
ngrok http 8000
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok-free.app`) and set it as `HOST` in your `.env`:

```bash
HOST=https://abc123.ngrok-free.app
```

Restart the server after changing `HOST`.

---

## 7. Verify the Server Is Running

```bash
curl http://localhost:8000/_healthz
# Expected: 200 OK

curl http://localhost:8000/_readyz
# Expected: 200 OK

curl http://localhost:8000/api-docs
# Expected: Swagger UI HTML
```

---

## Useful Dev Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) + remote debugger on :9229 |
| `npm start` | Start in production mode |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run create-indexes` | Create MongoDB indexes |

---

## Running via Docker

```bash
docker compose up --build
```

The `docker-compose.yml` builds the app and starts it on port `8081`. Set environment variables in `docker-compose.yml` or via an `.env` file.

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `401` on npm install | Azure DevOps token missing or expired |
| MongoDB connection refused | Start MongoDB: `docker start fynd-mongo` |
| Redis connection refused | Start Redis: `docker start fynd-redis` |
| `Cannot find module 'fit'` | Private packages not installed — check token |
| Webhooks not received | ngrok not running or `HOST` env not updated |
