---
title: Environments
sidebar_position: 1
---

# Environments

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

All deployment environments for the Fynd Shopify Ecosystem.

---

## Environment Overview

| Environment | Realm | Purpose | Primary Source of Truth |
|-------------|-------|---------|--------------------------|
| Development | local | Individual developer testing | Local `.env` + Shopify CLI configs |
| SIT | `fyndz0/m1` | System Integration Testing | `fik-fynd-extensions/environments/fynd/fyndz0/m1/` |
| UAT | `fyndz5/m1` | User Acceptance Testing | `fik-fynd-extensions/environments/fynd/fyndz5/m1/` |
| Extra logistics environments | `fyndz6/m1`, `fyndz7/m1`, `fyndz8/m1`, `fyndz9/m1` | Logistics extension/partner integration testing | `fik-fynd-extensions/environments/fynd/fyndz6..z9/m1/` |
| Production | `fynd/m2` | Live merchant traffic | `fik-fynd-extensions/environments/fynd/fynd/m2/` |

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
| `shopify.app.promise-sit.toml` | SIT app variant |
| `shopify.app.fynd-promise-testing.toml` | Testing app variant |
| `shopify.app.promise-dev-10.toml` | Dev app variant |
| `shopify.app.fynd-promise-dev.toml` | Dev app variant |

### Fynd Logistics

| Config File | Typical Use |
|-------------|-------------|
| `shopify.app.fynd-logistics-uat.toml` | UAT logistics app |
| `shopify.app.fynd-logistics-dev.toml` | Dev logistics app |
| `shopify.app.fynd-logistics-dev-devx.toml` | DevX logistics app |
| `shopify.app.fynd-logistics.toml` | Logistics app config (currently points to a temporary Cloudflare URL; validate before production use) |

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

1. Merge to main -> auto deploy to SIT (`fyndz0`)
2. Release branch/tag -> deploy to UAT (`fyndz5`)
3. Manual promotion -> Production (`fynd/m2`)
4. Post-deploy verification:
   - `/_healthz`
   - `/_readyz`
   - Sentry and logs for 15-30 min
