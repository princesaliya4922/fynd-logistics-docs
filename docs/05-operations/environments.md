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

| Environment | Cluster Name | Purpose | Deployed By |
|-------------|-------------|---------|-------------|
| Development | Local / ngrok | Individual developer testing | Developer manually |
| SIT | `fyndz0` | System Integration Testing | CI pipeline |
| UAT | `fyndz5` | User Acceptance Testing | CI pipeline |
| Pexar (extra UAT) | `fyndz6–z9` | Additional test environments for Logistics | CI pipeline |
| Production | `fynd/m2` | Live merchant traffic | Manual promotion |

---

## Service URLs by Environment

### shopify-pincode-checker (Fynd Promise)

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` (via ngrok for webhooks) |
| SIT | `https://pincode-checker.extensions.sit.fyndx1.de` |
| UAT | `https://pincode-checker.extensions.uat.fyndx1.de` |
| Production | `https://pincode-checker.extensions.fynd.com` |

### shopify-backend

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` (via ngrok for webhooks) |
| SIT | `https://shopify-backend.extensions.sit.fyndx1.de` |
| UAT | `https://shopify-backend.extensions.uat.fyndx1.de` |
| Production | `https://shopify-backend.extensions.fynd.com` |

### shopify-logistics-app (Fynd Logistics)

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| UAT | `https://shopify-logistics.extensions.uat.fyndx1.de` |
| fyndz6 | `https://shopify-logistics.extensions.<fyndz6-domain>` |
| Production | `https://shopify-logistics.extensions.fynd.com` |

> **Note:** The logistics app has additional test environments (`fyndz6`–`fyndz9`) on `pexar.io` domain for more isolated testing.

---

## Shopify App Configuration per Environment

### Fynd Promise

| Environment | Config File | Shopify App |
|-------------|------------|-------------|
| Production | `shopify.app.toml` | Fynd Promise (production) |
| Testing | `shopify.app.fynd-promise-testing.toml` | Fynd Promise Testing |
| SIT | `shopify.app.promise-sit.toml` | Fynd Promise SIT |
| Dev | `shopify.app.promise-dev-10.toml` | Dev-10 app |

### Fynd Logistics

| Environment | Config File | Shopify App |
|-------------|------------|-------------|
| Production | `shopify.app.fynd-logistics.toml` | Fynd Logistics (production) |
| UAT | `shopify.app.fynd-logistics-uat.toml` | Fynd Logistics UAT |
| Dev | `shopify.app.fynd-logistics-dev.toml` | Fynd Logistics Dev |

---

## Database Environments

| Environment | MongoDB | Redis |
|-------------|---------|-------|
| Development | Local Docker or Atlas (dev cluster) | Local Docker |
| SIT/UAT | Shared dev MongoDB cluster | Shared dev Redis |
| Production | `MONGO_SHOPIFY_BACKEND_READ_WRITE` (primary) + read replica | `REDIS_SHOPIFY_BACKEND_READ_WRITE` (primary) + read replica |

---

## Environment-Specific Sentry Projects

| Environment | Project DSN |
|-------------|------------|
| UAT (shopify-backend) | `https://397ea54267...@sentry.fynd.engineering/845` |
| Production (shopify-backend) | `https://8777c9b24c...@o71740.ingest.us.sentry.io/4509043013713920` |
| UAT (promise app) | `https://2f7c61c49d...@sentry.fynd.engineering/807` |
| Production (promise app) | `https://84c2ca17ad...@o71740.ingest.us.sentry.io/4509043013124097` |

---

## Feature Flags per Environment

| Feature | Development | SIT/UAT | Production |
|---------|-------------|---------|------------|
| Shopify billing test mode | ✅ | ✅ | ❌ (real charges) |
| Debug logging | ✅ | Configurable | ❌ |
| SSL bypass | ✅ (VPN) | ❌ | ❌ |
| New Relic APM | ❌ | ❌ | ✅ (fyndz6+, fynd) |

---

## Promoting to Production

Production deploys are **manual** — not automatic on every push to main.

1. Ensure all tests pass in UAT
2. Get approval from tech lead
3. Deploy via Azure Pipelines (manual trigger on `fynd/m2` environment)
4. Verify health endpoints after deploy
5. Monitor Sentry for 30 minutes post-deploy
