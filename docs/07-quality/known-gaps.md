---
title: Known Gaps
sidebar_position: 2
---

# Known Gaps & Technical Debt

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Active
> **Last Updated:** 2026-06-17

Known issues, missing documentation, and technical debt items.

---

## Test Coverage Gaps

| Area | Current State | Impact |
|------|--------------|--------|
| `shopify-backend` service coverage | Broad Jest suite exists, but large service files still have uncovered branches and integration boundaries | Medium — regressions can still hide in edge paths |
| `shopifyWebhookService.js` | Covered by webhook controller/service tests, but exact third-party payload contracts are not fully documented as fixtures | Medium — provider payload drift can still break processing |
| Frontend React components | Limited root Jest coverage; most React component/UI states are not covered with component tests | Medium — UI regressions not caught early |
| Billing cron (`cron/index.js`) | Route wiring/date helpers have tests, but the full cron execution path and Shopify usage-record side effects need focused tests | High — billing correctness is financially sensitive |
| Embedded app registration tests | `shopify-pincode-checker/spec/testFiles/registration.test.js` and `shopify-logistics-app/spec/testFiles/registration.test.js` are still placeholder-style tests | Low — backend registration has real tests; app-local registration templates add little value |

**Recommendation:** Start with integration tests for the most critical paths:
1. Order creation → fulfillment webhook
2. Pincode serviceability check
3. Billing cron execution
4. Frontend setup flows and extension UI states

---

## Documentation Gaps

| Doc | Missing Info |
|-----|-------------|
| Reference → API Backend | Full request/response schemas for each endpoint |
| Reference → Webhooks | Exact FDK webhook topics/payload contracts by event type |
| Operations → Environments | Runtime source-of-truth drift between Shopify app TOML and FIK overlays for Logistics environments |
| Data Pipeline | Active `shopify_backend` transformation path was not found in the local `transformations` checkout |

---

## Code-Level Technical Debt

| Item | File | Description |
|------|------|-------------|
| Large service files | `logisticsService.js` (186KB) | Single file too large, needs splitting |
| Duplicate extension | `fynd-promise-checkout` appears in both apps | Should be shared or eliminated |
| `Instruction.jsx` | `components/Instruction.jsx` | Component exists but is unused in Promise app |
| Legacy `companySelection/` | `shopify-logistics-app/web/frontend/components/companySelection/` | Legacy components alongside new `setting/` components |
| Test mode billing | `billing.js` | Test mode logic should use env var cleanly |
| Billing cron query drift | `controllers/billing.js` / `model/subscriptions.js` / `model/orders.js` | Cron filters uppercase `ACTIVE` while model status values are lowercase, and order counting references fields that do not exist on the current order model |
| Dead OTP route file | `routes/otpRoutes.js` | File exists but is not mounted by `index.js`; real OTP/account-linking routes live in `routes/logisticsRoutes.js` |

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
| Admin dashboard auth | `/logistics/admin` now uses OTP/session/CSRF/origin checks; keep `ADMIN_ALLOWED_EMAILS` and OTP/session settings configured in every deployed env |

---

## Updating This List

When you fix a known gap, remove it from this list. When you discover a new one, add it here. Keep this list current so it's useful to the team.
