---
title: Linting
sidebar_position: 3
---

# Linting

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## ESLint Configuration

`shopify-backend` uses **ESLint 9.15.0** with the flat config format.

```bash
# Run linting
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

The ESLint config file is `eslint.config.js` (or `.eslintrc.js`) at the repo root.

---

## Frontend Apps

Both frontend apps (React) use ESLint configured by Vite's default React preset.

The Vite scaffolding includes:
- `eslint-plugin-react`
- `eslint-plugin-react-hooks` (ensures hooks rules are followed)
- `eslint-plugin-react-refresh` (for Vite HMR compatibility)

---

## CI Enforcement

Linting runs as the first step in the CI pipeline. A lint failure blocks the build.

```yaml
# azure-pipelines.yml (simplified)
- script: npm run lint
  displayName: 'Lint check'
```

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
