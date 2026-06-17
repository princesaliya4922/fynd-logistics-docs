---
title: Environment Variables
sidebar_position: 5
---

# Environment Variables Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

Reference for the main environment variables across the three services. The authoritative schema is still each service's `config.js`.

---

## `services/shopify-backend`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | HTTP port. |
| `MODE` | No | `""` | Set to `cron` to run `cron/index.js` instead of the HTTP app. |
| `CRON_JOB` | Cron only | `""` | Recognized values include `billing_trigger`, `billing_trigger_last_day`, `test_cron_job`. |
| `MONGO_SHOPIFY_BACKEND_READ_WRITE` | Yes | `""` | MongoDB read/write URI. |
| `MONGO_SHOPIFY_BACKEND_READ_ONLY` | Yes | `""` | MongoDB read URI. Can match read/write locally. |
| `REDIS_SHOPIFY_BACKEND_READ_WRITE` | Yes | `""` | Redis read/write URI. Required during backend startup. |
| `REDIS_SHOPIFY_BACKEND_READ_ONLY` | Yes | `""` | Redis read URI. Can match read/write locally. |
| `LOGISTICS_SHOPIFY_API_KEY` | Yes | `""` | Shopify API key for Fynd Logistics session-token verification. |
| `SHOPIFY_LOGISTICS_LOGISTICS_SHOPIFY_API_SECRET_KEY` | Yes | `""` | Shopify API secret for Logistics JWT/HMAC verification. |
| `PROMISE_SHOPIFY_API_KEY` | Yes | `""` | Shopify API key for Fynd Promise session-token verification. |
| `SHOPIFY_LOGISTICS_PROMISE_SHOPIFY_API_SECRET_KEY` | Yes | `""` | Shopify API secret for Promise HMAC verification. |
| `PROMISE_SHOPIFY_HMAC_ENABLED` | No | `false` | Enables strict Promise webhook HMAC verification after the Promise secret is configured. |
| `SHOPIFY_MAX_CONCURRENCY` | No | `5` | Bounds concurrent Shopify Admin API fan-out. |
| `EXTENSION_BASE_URL` | Yes | `""` | Fynd extension/base API URL. |
| `EXTENSION_API_KEY` | Yes | `""` | Fynd extension API key. |
| `EXTENSION_API_SECRET` | Yes | `""` | Fynd extension API secret. |
| `FYND_DP_EXTENSION_ID` | Depends | `""` | Fynd delivery partner extension ID. |
| `FYND_PLATFORM_DOMAIN` | Depends | `""` | Fynd platform domain. |
| `CONSOLE_DOMAIN` | Depends | `""` | Console domain used to derive console API and redirect bases. |
| `GOOGLE_MAPS_API_KEY` | No | `""` | Google Maps API key. |
| `BOLTIC_USERNAME` | Internal routes | `""` | Basic Auth username for selected internal routes. |
| `BOLTIC_PASSWORD` | Internal routes | `""` | Basic Auth password for selected internal routes. |
| `ADMIN_AUTH_STRICT` | No | `false` | Fail startup if admin auth configuration is missing. |
| `ADMIN_ALLOWED_EMAILS` | Admin dashboard | `""` | Comma-separated allowlist for `/logistics/admin` OTP auth. |
| `ADMIN_OTP_TTL_SECONDS` | No | `300` | Admin OTP challenge TTL. |
| `ADMIN_OTP_MAX_ATTEMPTS_PER_CHALLENGE` | No | `5` | Admin OTP retry cap. |
| `ADMIN_SESSION_TTL_SECONDS` | No | `14400` | Admin dashboard session TTL. |
| `COMPANY_ID` | Depends | `""` | Default Fynd company ID for shared operations. |
| `API_KEY` | Depends | `""` | General API key used by backend integrations. |
| `APPLICATION_ID` | Depends | `""` | Fynd application ID. |
| `APPLICATION_TOKEN` | Depends | `""` | Fynd application token. |
| `LOGISTICS_DEFAULT_ENABLED` | No | `true` | Default logistics enabled state for first store registration. |
| `LOGISTICS_OPERATIONS_SUPPORT_EMAIL` | No | `""` | Support contact shown when logistics operations are disabled. |
| `LOGISTICS_DEFAULT_PASSWORD` | Depends | `""` | Default password for user creation. |
| `LOGISTICS_EXTENSIONS` | Depends | `[]` | JSON string of logistics extension configs. |
| `LOGISTICS_EXTENSION_API_BASE_URL` | Depends | `""` | Logistics extension API base URL. |
| `LOGISTICS_EXTENSION_API_PATH` | Depends | `""` | Logistics extension API path. |
| `LOGISTICS_EXTENSION_AUTH_TOKEN` | Depends | `""` | Auth token for logistics extension API. |
| `LOGISTICS_EXTENSION_APPLICATION_ID` | Depends | `""` | Application ID for logistics extension calls. |
| `FLP_PLATFORM_API_BASE_URL` | Depends | `""` | FLP Platform base URL. |
| `SHOPIFY_LOGISTICS_FLP_PLATFORM_AUTH_TOKEN` | Depends | `""` | FLP Platform auth token. |
| `FLP_WEBHOOK_CALLBACK_URL` | Depends | `""` | FLP webhook callback URL. |
| `SHOPIFY_LOGISTICS_FLP_WEBHOOK_AUTH_TOKEN` | Depends | `""` | FLP webhook auth token. |
| `BACKEND_DOMAIN` | Depends | `""` | Public backend domain used by some callback/config flows. |
| `FULFILLMENT_PROCESSING_MODE` | No | `sync` | `sync` or `memory-queue`. |
| `FULFILLMENT_SYNC_TIMEOUT` | No | `60000` | Sync fulfillment timeout in ms. |
| `FULFILLMENT_SYNC_MAX_RETRIES` | No | `3` | Max sync fulfillment retry attempts. |
| `FULFILLMENT_SYNC_RETRY_DELAY` | No | `500` | Initial retry delay in ms. |
| `ALLOWED_DOMAINS_REGEX` | No | built-in array | CORS allow-list regex array. |
| `FRAME_ANCESTORS` | No | `""` | CSP `frame-ancestors` value. |
| `HTTP_REQUEST_TIMEOUT_MS` | No | `30000` | Default outbound HTTP timeout. |
| `SHOPIFY_QUERY_COST_THRESHOLD` | No | `2000` | Shopify GraphQL cost threshold. |
| `METRICS_DIR` | No | `/var/data/metrics/` | Prometheus file metrics directory. |
| `METRICS_FLUSH_INTERVAL_MS` | No | `30000` | Metrics flush interval. |
| `K8S_POD_NAME` | No | hostname | Instance label for metrics. |
| `SENTRY_DSN` | No | `""` | Sentry DSN. |
| `NEW_RELIC_ENABLED` | No | `""` | Enables New Relic integration when configured. |
| `NEW_RELIC_APP_NAME` | No | `""` | New Relic app name. |
| `NEW_RELIC_LICENSE_KEY` | No | `""` | New Relic license key. |
| `BYPASS_SSL_VALIDATION` | No | `false` | Dev-only SSL validation bypass. |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | `1` | Node TLS validation switch. |

---

## `services/shopify-pincode-checker/web`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | App environment. |
| `PORT` | Deployment dependent | `""` | Express mini-server port. |
| `BACKEND_PORT` | Local dev | — | Directly read by `web/index.js`; takes precedence over `PORT` for the Express mini-server. |
| `FRONTEND_PORT` | Local dev | — | Directly read by `web/frontend/vite.config.js`. |
| `HOST` | Yes | `""` | Public HTTPS URL of the embedded app. |
| `BACKEND_URL` | Yes | `""` | Base URL for `services/shopify-backend`. |
| `BASE_API_KEY` | Yes | `""` | `x-api-key` value forwarded to backend APIs. |
| `SENTRY_DSN` | No | `""` | Sentry DSN. |
| `SHOPIFY_API_KEY` | Yes | — | Used by `web/shopify.js` for Shopify SDK initialization. |
| `SHOPIFY_API_SECRET` | Yes | — | Used by `web/shopify.js` for OAuth/session verification. |

---

## `services/shopify-logistics-app/web`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | App environment. |
| `PORT` | Deployment dependent | `""` | Express mini-server port. |
| `BACKEND_PORT` | Local dev | — | Directly read by `web/index.js`; takes precedence over `PORT` for the Express mini-server. |
| `FRONTEND_PORT` | Local dev | — | Directly read by `web/frontend/vite.config.js`. |
| `HOST` | Yes | `""` | Public HTTPS URL of the embedded app. |
| `BACKEND_URL` | Yes | `""` | Base URL for `services/shopify-backend`. |
| `BASE_API_KEY` | Yes | `""` | `x-api-key` value forwarded to backend APIs. |
| `REDIS_SHOPIFY_BACKEND_READ_WRITE` | Yes | `""` | Redis session-storage URL for Shopify sessions. |
| `SENTRY_DSN` | No | `""` | Sentry DSN. |
| `SHOPIFY_API_KEY` | Yes | — | Used by `web/shopify.js` for Shopify SDK initialization. |
| `SHOPIFY_API_SECRET` | Yes | — | Used by `web/shopify.js` for OAuth/session verification. |

---

## Notes

- Never commit real `.env` files.
- `REDIS_URL`, `ADMIN_PANEL_PASSWORD`, `LOGISTICS_SHOPIFY_API_SECRET_KEY`, and `PROMISE_SHOPIFY_API_SECRET_KEY` are stale names for the current code paths.
- Convict defaults allow many variables to be empty strings, but integrations will fail at runtime if required secrets are absent.
