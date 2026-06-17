---
title: Infrastructure
sidebar_position: 2
---

# Infrastructure

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

How the Fynd Shopify services are deployed and managed.

---

## Deployment Framework

The three services are deployed from the `shopify-apps` monorepo through Azure Pipelines and Fynd's infrastructure templates. The active pipeline is `shopify-apps/azure-pipeline.yaml`; it passes `services/*` paths to the shared `Infrastructure/kube-infrastructure` template.

FIK/Fynd infrastructure configuration still owns environment-specific Kubernetes settings, service hosts, secrets, and cron schedules.

---

## Runtime Services

| Service Path | Runtime Role | Public Host Family |
|--------------|--------------|--------------------|
| `services/shopify-backend` | Shared API server, webhooks, admin dashboard, cron entry point | `shopify-backend.extensions.*` |
| `services/shopify-pincode-checker` | Fynd Promise embedded app and Shopify extensions | `pincode-checker.extensions.*` |
| `services/shopify-logistics-app` | Fynd Logistics embedded app and Shopify extensions | `shopify-logistics.extensions.*` |

### Backend Process Modes

`services/shopify-backend/server.js` always initializes MongoDB and Redis first. After that:

| Env | Behavior |
|-----|----------|
| `MODE=cron` | Loads `cron/index.js` and dispatches the job named by `CRON_JOB` |
| anything else | Loads `index.js` and starts the FIT/Express HTTP app |

Recognized cron jobs in code are `billing_trigger`, `billing_trigger_last_day`, and `test_cron_job`.

---

## Data Stores

| Component | Store | Env Vars |
|-----------|-------|----------|
| `shopify-backend` | MongoDB | `MONGO_SHOPIFY_BACKEND_READ_WRITE`, `MONGO_SHOPIFY_BACKEND_READ_ONLY` |
| `shopify-backend` | Redis | `REDIS_SHOPIFY_BACKEND_READ_WRITE`, `REDIS_SHOPIFY_BACKEND_READ_ONLY` |
| `shopify-pincode-checker` app server | SQLite session file | `web/database.sqlite` |
| `shopify-logistics-app` app server | Redis session storage | `REDIS_SHOPIFY_BACKEND_READ_WRITE` |

The logistics app stores Shopify sessions with the `shopify_logistics_session_` prefix. The Promise app still uses local SQLite sessions and therefore has weaker horizontal scaling characteristics than the Redis-backed logistics app.

---

## Docker Images

Each service directory contains its own `Dockerfile`. The monorepo pipeline tells the shared infrastructure template to build each service from:

```yaml
servicePathPrefix: services
serviceDockerfile: Dockerfile
```

The root pipeline can skip unchanged service builds (`buildOnlyWhenChanged: true`) or force builds through tag messages emitted by `scripts/tagdeploy.sh`.

---

## Network Architecture

```
Internet / Shopify / Fynd
    ↓
Ingress / Fynd infrastructure
    ↓
    ├── pincode-checker.extensions.*  -> services/shopify-pincode-checker
    ├── shopify-logistics.extensions.* -> services/shopify-logistics-app
    └── shopify-backend.extensions.*  -> services/shopify-backend
```

`shopify-backend` applies CORS using `ALLOWED_DOMAINS_REGEX`. The default allow-list includes Fynd domains, Shopify CDN, `*.myshopify.com`, and localhost-style development origins.

---

## Security and Secrets

Runtime secrets are expected to be injected as environment variables by the deployment platform. Do not add new secrets to git-tracked files.

Important secret families:

| Area | Variables |
|------|-----------|
| Shopify app verification | `LOGISTICS_SHOPIFY_API_KEY`, `SHOPIFY_LOGISTICS_LOGISTICS_SHOPIFY_API_SECRET_KEY`, `PROMISE_SHOPIFY_API_KEY`, `SHOPIFY_LOGISTICS_PROMISE_SHOPIFY_API_SECRET_KEY` |
| Backend data stores | `MONGO_SHOPIFY_BACKEND_*`, `REDIS_SHOPIFY_BACKEND_*` |
| Fynd extension auth | `EXTENSION_API_KEY`, `EXTENSION_API_SECRET`, `LOGISTICS_EXTENSION_AUTH_TOKEN` |
| FLP | `FLP_PLATFORM_API_BASE_URL`, `SHOPIFY_LOGISTICS_FLP_PLATFORM_AUTH_TOKEN`, `SHOPIFY_LOGISTICS_FLP_WEBHOOK_AUTH_TOKEN` |
| Admin dashboard | `ADMIN_ALLOWED_EMAILS`, `ADMIN_OTP_*`, `ADMIN_SESSION_TTL_SECONDS` |
| Internal Basic Auth | `BOLTIC_USERNAME`, `BOLTIC_PASSWORD` |

`BOLTIC_USERNAME` / `BOLTIC_PASSWORD` are currently used for selected internal routes such as `/map/mapInventories` and `/webhook/extension/status`, not for the main logistics admin dashboard.

---

## Health Checks

Current backend HTTP behavior:

| Endpoint | Result |
|----------|--------|
| `GET /` | `200 OK` HTML body |
| `GET /api-docs` | Swagger UI |
| `GET /_healthz` | 404, not implemented |
| `GET /_readyz` | 404, not implemented |

If Kubernetes probes still target `/_healthz` or `/_readyz`, the probe configuration must be changed or the endpoints must be implemented.
