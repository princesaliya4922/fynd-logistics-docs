---
title: Linting
sidebar_position: 3
---

# Linting

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## ESLint Configuration

`services/shopify-backend` uses ESLint with the flat config format (`eslint.config.mjs`).

```bash
# Run linting
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

Run these commands from `services/shopify-backend`.

---

## Frontend Apps

The current root package scripts for `services/shopify-pincode-checker` and `services/shopify-logistics-app` do not expose `npm run lint`; they expose Shopify CLI commands plus Jest tests. Add lint scripts before documenting lint as CI-enforced for those services.

The Vite scaffolding includes:
- `eslint-plugin-react`
- `eslint-plugin-react-hooks` (ensures hooks rules are followed)
- `eslint-plugin-react-refresh` (for Vite HMR compatibility)

---

## CI Enforcement

The monorepo pipeline delegates build behavior to the shared `kube-infrastructure` template. Do not assume a lint step is enforced for every service unless the template or service config explicitly runs it.

---

## Common Lint Rules

For the backend:
- `no-unused-vars` — catch dead code
- `no-console` — use `logger.info()` instead of `console.log()`
- `prefer-const` — immutable bindings preferred
- `no-var` — use `let` or `const`

For the frontend:
- `react-hooks/rules-of-hooks` — hooks must be called at top level
- `react-hooks/exhaustive-deps` — useEffect dependencies must be complete
