---
title: Environments
sidebar_position: 1
---

# Environments

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

All deployment environments for the Fynd Shopify Ecosystem.

---

## Environment Overview

| Environment | Realm | Purpose | Primary Source of Truth |
|-------------|-------|---------|--------------------------|
| Development | local | Individual developer testing | Local `.env` + Shopify CLI configs in `shopify-apps/services/*` |
| UAT / non-prod | varies by env tag, commonly `fyndz5` | User Acceptance Testing | `shopify-apps` deploy tag + infrastructure env config |
| Production | production env tags such as `fynd` | Live merchant traffic | `shopify-apps` deploy tag + infrastructure env config |

---

## Realm Domain Map (FIK)

| Realm | `Common.Domains.FyndPlatform` | `Common.ApiHost` |
|------|-------------------------------|------------------|
| `fyndz0` | `sit.fyndx1.de` (from configured service hosts) | (realm-specific) |
| `fyndz5` | `uat.fyndx1.de` (from configured service hosts) | (realm-specific) |
| `fyndz6` | `pexar.io` | `api.pexar.io` |
| `fyndz7` | `fyndz7.pexar.io` | `api.fyndz7.pexar.io` |
| `fyndz8` | `rhos.fyndx1.de` | `api.konnect.rhos.fyndx1.de` |
| `fyndz9` | `fyndz9.fyndx1.de` | `api.konnect.fyndz9.fyndx1.de` |
| `fynd` | `fynd.com` | (production API host family) |

---

## Service URLs (Explicitly Configured)

### shopify-pincode-checker (Fynd Promise)

| Environment | URL | Source |
|-------------|-----|--------|
| Development | `http://localhost:3000` | local run |
| SIT (`fyndz0`) | `https://pincode-checker.extensions.sit.fyndx1.de` | `.../fyndz0/m1/projects/shopify-app.yaml` (`HOST`) |
| UAT (`fyndz5`) | `https://pincode-checker.extensions.uat.fyndx1.de` | `.../fyndz5/m1/projects/shopify-app.yaml` (`HOST`) |
| Production (`fynd/m2`) | `https://pincode-checker.extensions.fynd.com` | `.../fynd/m2/projects/shopify-app.yaml` (`HOST`) |

### shopify-backend

| Environment | URL | Source |
|-------------|-----|--------|
| Development | `http://localhost:8000` | local run |
| SIT (`fyndz0`) | `https://shopify-backend.extensions.sit.fyndx1.de` | `.../fyndz0/m1/projects/shopify-app.yaml` (`BACKEND_URL`) |
| UAT (`fyndz5`) | `https://shopify-backend.extensions.uat.fyndx1.de` | `.../fyndz5/m1/projects/shopify-app.yaml` (`BACKEND_URL`) |
| Production (`fynd/m2`) | `https://shopify-backend.extensions.fynd.com` | `.../fynd/m2/projects/shopify-app.yaml` (`BACKEND_URL`) |

### shopify-logistics-app (Fynd Logistics)

| Environment | URL | Source |
|-------------|-----|--------|
| Development | `http://localhost:3000` | local run |
| UAT (`fyndz5`) | `https://shopify-logistics.extensions.uat.fyndx1.de` | `.../fyndz5/m1/projects/shopify-app.yaml` (`ShopifyLogistics.HOST`) |

> `ShopifyLogistics` project entries are currently present in `fyndz5` only in this infra repo. There are no `ShopifyLogistics` entries in `fyndz6–z9` or `fynd/m2` under `projects/shopify-app.yaml` at the time of this doc update.

---

## Logistics Partner Extension URLs (z6-z9)

These environments run courier/logistics extension services (Delhivery, Dunzo, Xpressbees, etc.), not just the Shopify embedded app.

| Realm | Example `EXTENSION_BASE_URL` |
|-------|-------------------------------|
| `fyndz6` | `https://delhivery.extensions.pexar.io` |
| `fyndz7` | `https://delhivery.extensions.fyndz7.de` |
| `fyndz8` | `https://delhivery.extensions.rhos.fyndx1.de` |
| `fyndz9` | `https://delhivery.extensions.fyndz9.fyndx1.de` |

Source: `fik-fynd-extensions/environments/fynd/fyndz6..z9/m1/projects/logistics.yaml`

---

## Shopify App Configuration Files

### Fynd Promise

| Config File | Typical Use |
|-------------|-------------|
| `shopify.app.toml` | Production Promise app |
| `shopify.app.pincode-serviceability-test.toml` | UAT/SIT testing app |
| `shopify.app.fynd-promise-testing.toml` | Testing app variant |

### Fynd Logistics

| Config File | Typical Use |
|-------------|-------------|
| `shopify.app.fynd-logistics-dev-devx.toml` | DevX logistics app |
| `shopify.app.fynd-logistics-uat.toml` | UAT logistics app |
| `shopify.app.fynd-logistics-prod.toml` | Production logistics app, named "Fynd Ship" |
| `shopify.app.toml` | Present in the logistics service but Promise-branded; do not treat as production logistics config |

---

## Database Environments

| Environment | MongoDB | Redis |
|-------------|---------|-------|
| Development | Local Docker or Atlas (dev cluster) | Local Docker |
| SIT/UAT | Shared non-prod cluster(s) | Shared non-prod Redis |
| Production | `MONGO_SHOPIFY_BACKEND_READ_WRITE` (+ read replica) | `REDIS_SHOPIFY_BACKEND_READ_WRITE` (+ read replica) |

---

## Feature Flags by Stage

| Feature | Development | SIT/UAT | Production |
|---------|-------------|---------|------------|
| Shopify billing test mode | ✅ | ✅ | ❌ |
| Debug logging | ✅ | Configurable | ❌ |
| SSL bypass (`BYPASS_SSL_VALIDATION`) | Sometimes | ❌ | ❌ |
| New Relic APM | Optional | Optional | Enabled per env policy |

---

## Promotion Path

1. Merge/sync code into the target `shopify-apps` branch (`uat` or `production`).
2. Create a `deploy.*` tag with `scripts/tagdeploy.sh`.
3. Let the monorepo Azure pipeline build changed services from `services/*`.
4. Post-deploy verification:
   - `GET /` on `shopify-backend`
   - `GET /api-docs` on `shopify-backend`
   - Sentry, logs, and merchant smoke tests for 15-30 min
