---
title: "ADR-001: SQLite vs Redis for Sessions"
sidebar_position: 1
---

# ADR-001: SQLite vs Redis for Session Storage

> **Status:** Accepted
> **Owner:** Engineering — Fynd Extensions Team
> **Date:** 2024 (reconstructed)
> **Last Updated:** 2026-03-23

---

## Context

Both Shopify apps need to store Shopify OAuth session tokens. When a merchant authenticates, the access token must be persisted so subsequent requests can be validated.

The `@shopify/shopify-app-express` library supports multiple session storage backends.

## Decision

| App | Session Storage | Library |
|-----|----------------|---------|
| shopify-pincode-checker (Promise) | SQLite | `@shopify/shopify-app-session-storage-sqlite` |
| shopify-logistics-app (Logistics) | Redis | `@shopify/shopify-app-session-storage-redis` |

## Rationale

### Why SQLite for Promise App

- The Promise app is simpler — it primarily reads configuration and checks serviceability
- SQLite is zero-configuration and file-based (`database.sqlite`)
- No external service dependency simplifies deployment and local development
- Lower operational overhead for a simpler use case

### Why Redis for Logistics App

- The Logistics app processes webhooks, fulfillments, and has higher concurrency needs
- Redis supports multiple pods reading/writing sessions (horizontal scaling)
- SQLite would create race conditions with multiple replicas reading/writing the same file
- The backend already uses Redis for caching, so adding sessions there adds minimal complexity
- Session prefix `shopify_logistics_session_*` makes cleanup on app uninstall simple

## Consequences

**Positive:**
- Promise app has zero external session dependency (simpler ops)
- Logistics app scales horizontally without session conflicts

**Negative:**
- Promise app cannot run multiple replicas safely (SQLite file locking)
- Two different session mechanisms to understand and maintain

## Notes

If the Promise app ever needs horizontal scaling, it should migrate to Redis session storage. The migration would be: add Redis connection, swap the session storage adapter, drain SQLite sessions.
