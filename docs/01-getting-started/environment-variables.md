---
title: Environment Variables
sidebar_position: 5
---

# Environment Variables Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Complete reference for all environment variables across all three projects.

---

## shopify-backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | `development` or `production`. Controls billing test mode, logging level. |
| `PORT` | No | `8000` | Port the Express server listens on. |
| `MODE` | No | `""` | Set to `cron` to run cron jobs instead of the web server. |
| `MONGO_SHOPIFY_BACKEND_READ_WRITE` | Yes | — | Primary MongoDB connection string (read + write). |
| `MONGO_SHOPIFY_BACKEND_READ_ONLY` | Yes | — | Read-only MongoDB replica connection string. Can be same as read/write locally. |
| `REDIS_SHOPIFY_BACKEND_READ_WRITE` | Yes | — | Primary Redis connection string (read + write). |
| `REDIS_SHOPIFY_BACKEND_READ_ONLY` | Yes | — | Read-only Redis connection string. |
| `LOGISTICS_SHOPIFY_API_KEY` | Yes | — | Shopify API key for the Fynd Logistics app. Used to verify session tokens. |
| `LOGISTICS_SHOPIFY_API_SECRET_KEY` | Yes | — | Shopify API secret for the Fynd Logistics app. Used for JWT/HMAC verification. |
| `PROMISE_SHOPIFY_API_KEY` | Yes | — | Shopify API key for the Fynd Promise app. |
| `PROMISE_SHOPIFY_API_SECRET_KEY` | Yes | — | Shopify API secret for the Fynd Promise app. |
| `EXTENSION_BASE_URL` | Yes | — | Base URL of the Fynd platform extension services. |
| `EXTENSION_API_KEY` | Yes | — | API key for authenticating with Fynd extension services. |
| `EXTENSION_API_SECRET` | Yes | — | API secret for Fynd extension services. |
| `LOGISTICS_API_BASE_URL_CENTRAL_SIT` | Yes | — | Fynd Central integration base URL for user/org/account flows. |
| `LOGISTICS_API_BASE_URL_UAT` | Yes | — | Fynd UAT API base URL for auth/extension install/billing flows. |
| `LOGISTICS_API_BASE_URL_CONSOLE_UAT` | Yes | — | Fynd Console UAT base URL for product account lookups. |
| `FLP_PLATFORM_API_BASE_URL` | Yes | — | FLP Platform API base URL (shipment creation). |
| `LOGISTICS_EXTENSION_API_BASE_URL` | Yes | — | Fynd Logistics Extension API base URL (delivery partners). |
| `LOGISTICS_EXTENSION_API_PATH` | No | — | Path prefix for logistics extension API. |
| `LOGISTICS_EXTENSION_AUTH_TOKEN` | Yes | — | Auth token for logistics extension API. |
| `FYND_DP_EXTENSION_ID` | Yes | — | Fynd delivery partner extension ID. |
| `FYND_PLATFORM_DOMAIN` | Yes | — | Fynd platform domain suffix (e.g., `fynd.com`). |
| `COMPANY_ID` | Yes | — | Default Fynd company ID used for shared operations. |
| `API_KEY` | Yes | — | General Fynd platform API key. |
| `APPLICATION_ID` | Yes | — | Fynd application ID. |
| `APPLICATION_TOKEN` | Yes | — | Fynd application token. |
| `BOLTIC_USERNAME` | Yes | — | Username for basic auth on internal/admin API endpoints. |
| `BOLTIC_PASSWORD` | Yes | — | Password for basic auth on internal/admin API endpoints. |
| `ADMIN_PANEL_PASSWORD` | Yes | — | Password for admin dashboard UI unlock (`/logistics/admin`). |
| `GOOGLE_MAPS_API_KEY` | No | — | Google Maps API key for distance/location calculations. |
| `SENTRY_DSN` | No | — | Sentry DSN for error tracking. Leave blank to disable. |
| `SENTRY_ENVIRONMENT` | No | `development` | Sentry environment tag. |
| `FULFILLMENT_PROCESSING_MODE` | No | `sync` | `sync` or `memory-queue`. Controls how fulfillment jobs are processed. |
| `FULFILLMENT_SYNC_TIMEOUT` | No | `60000` | Timeout (ms) for synchronous fulfillment processing. |
| `FULFILLMENT_SYNC_MAX_RETRIES` | No | `3` | Maximum retry attempts for failed fulfillments. |
| `FULFILLMENT_SYNC_RETRY_DELAY` | No | `1000` | Initial retry delay (ms), doubles on each retry (exponential backoff). |
| `ALLOWED_DOMAINS_REGEX` | No | — | Regex pattern for CORS allowed origins. |
| `FRAME_ANCESTORS` | No | — | CSP `frame-ancestors` directive value. |
| `CRON_JOB` | No | — | Cron job type when `MODE=cron`. Values: `billing_trigger`, `test_cron_job`. |
| `TRACING_ENABLED` | No | `false` | Enable distributed tracing. |
| `LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`). |
| `NEW_RELIC_ENABLED` | No | `false` | Enable New Relic APM monitoring. |
| `NEW_RELIC_APP_NAME` | No | — | App name in New Relic. |
| `NEW_RELIC_LICENSE_KEY` | No | — | New Relic license key. |
| `BYPASS_SSL_VALIDATION` | No | `false` | Set to `true` to bypass SSL cert checks (dev only with VPN). |

---

## shopify-pincode-checker (web server)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHOPIFY_API_KEY` | Yes | — | Shopify API key for the Fynd Promise app. Used to init Shopify client. |
| `SHOPIFY_API_SECRET` | Yes | — | Shopify API secret. Used for OAuth and session verification. |
| `HOST` | Yes | — | Public HTTPS URL of this app (ngrok in dev, domain in prod). |
| `BACKEND_URL` | Yes | — | URL of the `shopify-backend` service. All merchant data APIs proxy here. |
| `BASE_API_KEY` | Yes | — | `x-api-key` header value sent to `shopify-backend`. |
| `NODE_ENV` | No | `development` | `development` or `production`. |
| `BACKEND_PORT` | No | `3000` | Port for the Express server. |
| `FRONTEND_PORT` | No | `3001` | Port for the Vite dev server. |
| `SENTRY_DSN` | No | — | Sentry DSN for the Promise app. |

---

## shopify-logistics-app (web server)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHOPIFY_API_KEY` | Yes | — | Shopify API key for the Fynd Logistics app. |
| `SHOPIFY_API_SECRET` | Yes | — | Shopify API secret for Logistics app. |
| `HOST` | Yes | — | Public HTTPS URL of this app. |
| `BACKEND_URL` | Yes | — | URL of the `shopify-backend` service. |
| `BASE_API_KEY` | Yes | — | `x-api-key` header value sent to `shopify-backend`. |
| `REDIS_URL` | Yes | — | Redis connection string for session storage. |
| `NODE_ENV` | No | `development` | `development` or `production`. |
| `BACKEND_PORT` | No | `3000` | Port for the Express server. |
| `FRONTEND_PORT` | No | `3001` | Port for the Vite dev server. |
| `SENTRY_DSN` | No | — | Sentry DSN for the Logistics app. |

---

## Notes

- **Never commit `.env` files.** They are in `.gitignore` in all repos.
- In production, all secrets are injected via Kubernetes Secrets managed by FIK (Fynd Infrastructure Kit).
- The `convict` library validates all env vars on startup. If a required var is missing, the server will fail to start with a descriptive error.
- Shopify app secrets are read from direct env vars (`LOGISTICS_SHOPIFY_API_*`, `PROMISE_SHOPIFY_API_*`) in `shopify-backend/config.js`.
