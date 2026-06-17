---
title: Contribution Guide
sidebar_position: 1
---

# Contribution Guide

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `uat` | UAT monorepo snapshot. Can be refreshed with `scripts/sync_uat_services.sh`. |
| `production` | Production monorepo snapshot. Can be refreshed with `scripts/sync_production_services.sh`. |
| `feature/<ticket-id>-short-description` | New features |
| `fix/<ticket-id>-short-description` | Bug fixes |
| `hotfix/<ticket-id>-short-description` | Urgent production fixes |
| `chore/<description>` | Dependency updates, refactoring |

Examples:
- `feature/LOG-123-otp-resend-improvements`
- `fix/PROM-456-pincode-validation`
- `hotfix/LOG-789-fulfillment-timeout`

---

## Pull Request Process

1. **Create branch** from the intended target branch (`uat` or `production`)
2. **Write code** with tests if adding new functionality
3. **Run locally:**
   ```bash
   npm run lint
   npm test
   ```
4. **Open PR** against the target branch
5. **Fill in PR template:**
   - What changed and why
   - Testing done
   - Did you update docs? (link to `fynd-docs` PR if relevant)
6. **Get review** from at least one team member
7. **Merge** after approval and CI green

---

## Code Review Guidelines

**For reviewers:**
- Focus on correctness, security, performance
- Check that error handling is present
- Verify API changes are backward-compatible
- Check for hardcoded values that should be config
- Flag any new secrets or sensitive data

**For authors:**
- Keep PRs focused — one concern per PR
- Add context in PR description (link to ticket, explain the "why")
- Respond to all review comments
- Don't merge without approval

---

## Commit Messages

Use conventional commits:

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

Examples:
```
feat(logistics): add OTP resend timer
fix(billing): correct free tier order count
docs: update README with local setup instructions
chore(deps): update shopify-api to v9.3.1
```

---

## Adding New API Endpoints

1. **Service path** — make changes under `shopify-apps/services/shopify-backend`
2. **Route file** — add route in `routes/<area>.js`
3. **Controller** — add handler in `controllers/<area>Controller.js`
4. **Service** — add business logic in `controllers/services/<area>Service.js`
5. **Swagger** — add JSDoc `@swagger` annotation to the route where applicable
6. **Tests** — add integration test in `spec/testFiles/<area>.test.js`
7. **Docs** — update `fynd-docs/docs/03-reference/api-backend.md`

---

## Adding New Environment Variables

1. Add to `config.js` (convict schema) with type, default, and env mapping
2. Add to `fynd-docs/docs/01-getting-started/environment-variables.md`
3. Add to the active infrastructure config for the target deployment environment
4. Add to Vault/Secrets for each environment
5. Never put actual secret values in config files

---

## Updating Docs

When you make a code change that affects the developer-facing behavior:
1. Open a PR in `fynd-docs` alongside your `shopify-apps` code PR
2. Link the two PRs to each other
3. Both should be reviewed and merged together (code first, then docs)
