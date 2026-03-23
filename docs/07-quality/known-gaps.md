---
title: Known Gaps
sidebar_position: 2
---

# Known Gaps & Technical Debt

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Active
> **Last Updated:** 2026-03-23

Known issues, missing documentation, and technical debt items.

---

## Test Coverage Gaps

| Area | Current State | Impact |
|------|--------------|--------|
| `shopify-backend` services (logisticsService, fulfilmentService, etc.) | No tests | High — core business logic untested |
| `shopifyWebhookService.js` | No tests | High — webhook processing not tested |
| Frontend React components (all 3 apps) | No tests | Medium — UI regressions not caught |
| Billing cron (`cron/index.js`) | No tests | High — billing correctness not verified |
| `spec/testFiles/registration.test.js` | Placeholder only | Low — just a template |

**Recommendation:** Start with integration tests for the most critical paths:
1. Order creation → fulfillment webhook
2. Pincode serviceability check
3. Billing cron execution

---

## Documentation Gaps

| Doc | Missing Info |
|-----|-------------|
| Reference → API Backend | Full request/response schemas for each endpoint |
| Reference → Webhooks | Exact FDK webhook topics/payload contracts by event type |
| Operations → Environments | Runtime source-of-truth drift between Shopify app TOML and FIK overlays for Logistics environments |

---

## Code-Level Technical Debt

| Item | File | Description |
|------|------|-------------|
| Large service files | `logisticsService.js` (186KB) | Single file too large, needs splitting |
| Duplicate extension | `fynd-promise-checkout` appears in both apps | Should be shared or eliminated |
| `Instruction.jsx` | `components/Instruction.jsx` | Component exists but is unused in Promise app |
| Legacy `companySelection/` | `shopify-logistics-app/web/frontend/components/companySelection/` | Legacy components alongside new `setting/` components |
| Test mode billing | `billing.js` | Test mode logic should use env var cleanly |

---

## Infrastructure Gaps

| Item | Description |
|------|-------------|
| SQLite horizontal scaling | Promise app cannot scale to multiple replicas due to SQLite session storage |
| No staging for logistics fyndz6–z9 | Multiple parallel test environments add config management complexity |

---

## Security Notes

| Item | Description |
|------|-------------|
| `BYPASS_SSL_VALIDATION` | This flag disables TLS verification. Must NEVER be enabled in production. |
| `.env` in dev repos | Developer must be careful not to commit `.env` files (gitignore protects against accidental adds) |
| Admin panel password | Served at `/logistics/admin` — uses basic auth over HTTPS |

---

## Updating This List

When you fix a known gap, remove it from this list. When you discover a new one, add it here. Keep this list current so it's useful to the team.
