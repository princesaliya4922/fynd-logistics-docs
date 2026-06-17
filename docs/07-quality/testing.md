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

The backend currently has a broad Jest suite under `spec/testFiles/` (108 test files in the audited checkout). Active areas include:

| Area | Example Files |
|------|---------------|
| Auth and security middleware | `shopifySessionAuth.test.js`, `shopifyHmacAuth.test.js`, `adminAuth.middleware.test.js`, `adminAuthService.test.js`, `basicAuth.test.js` |
| Registration and app uninstall | `registration.test.js`, `registrationAuth.test.js`, `appUninstallService.test.js` |
| Fulfillment and returns | `fulfilmentService.*.test.js`, `returnService.*.test.js`, `returnEligibility.controller.*.test.js` |
| Webhooks | `webhook.controller.*.test.js`, `shopifyWebhookService.*.test.js`, `flpWebhook.route.test.js` |
| Serviceability and logistics setup | `serviceability.*.test.js`, `logisticsService.*.test.js`, `locationsService.*.test.js` |
| Routing and config | `routes.wiring.test.js`, `routes.coverage.test.js`, `logistics.config.operationsSupportEmail.test.js` |

### shopify-pincode-checker / shopify-logistics-app

Both embedded apps have small root-level Jest suites for billing, `fyndIntegration`, logging, Sentry setup, and placeholder registration tests. Logistics additionally has tests for navigation and OTP flow error parsing. These are not comprehensive React component tests.

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

## Known Gap: Remaining Test Coverage

See [Quality → Known Gaps](./known-gaps.md) for the full picture.

- Large backend services still need branch/contract coverage in high-risk areas.
- Billing cron and Shopify usage-record behavior need focused end-to-end tests.
- Frontend React components and setup flows need component-level coverage.

---

## Adding New Tests

When adding tests for the backend:

1. Create file in `spec/testFiles/<feature>.test.js`
2. Import test utilities from `spec/testUtilites/`
3. Use Supertest for HTTP endpoint tests
4. Use Jest mocks for external services (Fynd API, Shopify API)
5. Use a test MongoDB database (configured via `MONGO_SHOPIFY_BACKEND_READ_WRITE` pointing to test DB)
