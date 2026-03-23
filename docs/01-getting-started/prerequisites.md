---
title: Prerequisites
sidebar_position: 1
---

# Prerequisites

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Before you can run any of the Fynd Shopify projects locally, you need the following tools and access.

---

## Required Tools

### Node.js

All three projects require **Node.js 18+** (backend requires ≥18.0.0; frontends use React 18 + Vite 6).

```bash
node --version   # should be v18.x or higher
npm --version    # should be v9.x or higher
```

Install via [nvm](https://github.com/nvm-sh/nvm) (recommended):

```bash
nvm install 20
nvm use 20
```

### Shopify CLI

Required to develop and deploy Shopify apps and extensions.

```bash
npm install -g @shopify/cli @shopify/app
shopify version  # confirm installation
```

### ngrok

Required to expose your local backend to the internet so Shopify can send webhooks during development.

```bash
npm install -g ngrok
# or install from https://ngrok.com/download
ngrok --version
```

### Docker (optional for local backend)

The backend can be run via Docker instead of bare Node.js.

```bash
docker --version
docker compose version
```

---

## Required Services

### MongoDB

The `shopify-backend` uses MongoDB. For local development:

**Option A — Docker:**
```bash
docker run -d -p 27017:27017 --name fynd-mongo mongo:6
```

**Option B — MongoDB Atlas:**
Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com). Copy the connection string for `MONGO_SHOPIFY_BACKEND_READ_WRITE`.

### Redis

The `shopify-logistics-app` backend uses Redis for session storage.

**Option A — Docker:**
```bash
docker run -d -p 6379:6379 --name fynd-redis redis:7
```

**Option B — Redis Cloud:**
Create a free instance at [redis.io/try-free](https://redis.io/try-free). Copy the connection string for `REDIS_URL`.

> **Note:** `shopify-pincode-checker` uses SQLite for sessions (file-based, no setup needed).

---

## Required Access

| Access | What It's For | How to Get |
|--------|--------------|-----------|
| Shopify Partner Account | Create/manage Shopify apps | [partners.shopify.com](https://partners.shopify.com) |
| Shopify Development Store | Test the apps without a real store | Create via Shopify Partners dashboard |
| Fynd Backend URL | The `BACKEND_URL` env var pointing to the `shopify-backend` | Get from team — internal service |
| Fynd API Key (`BASE_API_KEY`) | Auth header `x-api-key` for backend → Fynd API calls | Get from team — secret |
| Sentry DSN | Error tracking (optional locally) | Get from team or leave blank |
| Azure DevOps Token | Required to install private npm packages (`fit`, `fdk-client`) | Get from team — set as `AZURE_PRIVATE_TOKEN_BASE64` |

---

## Knowledge Prerequisites

| Topic | Why It Matters |
|-------|---------------|
| React (hooks, context) | All frontends are React 18 SPAs |
| Express.js | The backend is an Express app |
| Shopify App development basics | Understand OAuth, session tokens, App Bridge |
| MongoDB / Mongoose | The backend uses MongoDB heavily |
| REST APIs | All integrations are REST |

Not required but helpful: Shopify CLI, Polaris components, Jotai state management, Convict config.
