---
title: Testing
sidebar_position: 1
---

# Testing

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Draft
> **Last Updated:** 2026-06-17

---

## Test Framework

All three services use **Jest** for root-level tests. The logistics service also has Vitest installed in its dependency tree, but the checked package scripts still use Jest.

| Service Path | Test Script | Coverage Script |
|--------------|-------------|-----------------|
| `services/shopify-backend` | `npm test` | `npm run test:coverage` |
| `services/shopify-pincode-checker` | `npm test` | `npm run test:coverage` |
| `services/shopify-logistics-app` | `npm test` | `npm run test:coverage` |

---

## Running Tests

```bash
# Run tests from a service root
npm test

# Run with coverage
npm run test:coverage

# Watch mode (development)
npx jest --watch
```

Test flags used:
- `--detectOpenHandles` — Reports tests that leave open handles (database connections, timers)
- `--runInBand` — Runs tests sequentially (important for shared MongoDB connections)

---

There is no monorepo-root npm workspace command for running all service tests.

## Coverage Configuration

### shopify-backend

```json
{
  "jest": {
    "collectCoverage": true,
    "collectCoverageFrom": ["<rootDir>/routes/**/*.js"],
    "coverageReporters": ["json-summary", "json"]
  }
}
```

Coverage is collected primarily for route files, then backend coverage tooling runs `spec/testUtilites/nodeVersionCheck.js` and `spec/testUtilites/saveCoverageData.js`.

### Frontend Apps

```json
{
  "jest": {
    "collectCoverage": true,
    "coverageReporters": ["json-summary", "json"]
  }
}
```

---

## Existing Tests

### shopify-backend

| File | Status | Coverage |
|------|--------|---------|
| `spec/testFiles/shopifySessionAuth.test.js` | Active | Tests JWT session auth middleware |
| `spec/testFiles/registration.test.js` | Placeholder | Template only — no real tests |

### shopify-pincode-checker / shopify-logistics-app

| File | Status | Coverage |
|------|--------|---------|
| `spec/testFiles/registration.test.js` | Placeholder | Template only |

---

## Test Utilities

`spec/testUtilites/` — shared test helpers for:
- Creating mock Shopify sessions
- Setting up test Express apps
- MongoDB test connection setup

---

## Integration Testing Notes

The `shopifySessionAuth.test.js` uses **Supertest** to test the actual Express middleware:

```javascript
const request = require('supertest')
const app = require('../index')

test('returns 401 for invalid session token', async () => {
  const response = await request(app)
    .get('/logistics/plan')
    .set('Authorization', 'Bearer invalid-token')
  expect(response.status).toBe(401)
})
```

---

## Known Gap: Minimal Test Coverage

See [Quality → Known Gaps](./known-gaps.md) for the full picture.

- `fulfilmentService.js` / fulfillment processors
- `shopifyWebhookService.js`
- `logisticsService.js`
- Billing cron and Shopify usage-record behavior
- Admin OTP auth / CSRF / origin middleware
- All frontend React components

---

## Adding New Tests

When adding tests for the backend:

1. Create file in `spec/testFiles/<feature>.test.js`
2. Import test utilities from `spec/testUtilites/`
3. Use Supertest for HTTP endpoint tests
4. Use Jest mocks for external services (Fynd API, Shopify API)
5. Use a test MongoDB database (configured via `MONGO_SHOPIFY_BACKEND_READ_WRITE` pointing to test DB)
