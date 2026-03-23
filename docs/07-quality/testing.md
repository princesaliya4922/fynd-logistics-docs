---
title: Testing
sidebar_position: 1
---

# Testing

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Draft
> **Last Updated:** 2026-03-23

---

## Test Framework

All three projects use **Jest** for testing.

| Project | Jest Version | Config Location |
|---------|-------------|----------------|
| shopify-backend | 29.7.0 | `package.json` |
| shopify-pincode-checker | (root package) | `package.json` |
| shopify-logistics-app | (root package) | `package.json` |

---

## Running Tests

```bash
# Run all tests
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

Coverage is collected **only for route files** (not services, models, or utils). Output: `coverage_output.json`.

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

The most critical areas lacking tests:
- `fulfilmentService.js` (186KB — core fulfillment engine)
- `shopifyWebhookService.js` (64KB — webhook processing)
- `logisticsService.js` (the largest service file)
- All frontend React components

---

## Adding New Tests

When adding tests for the backend:

1. Create file in `spec/testFiles/<feature>.test.js`
2. Import test utilities from `spec/testUtilites/`
3. Use Supertest for HTTP endpoint tests
4. Use Jest mocks for external services (Fynd API, Shopify API)
5. Use a test MongoDB database (configured via `MONGO_SHOPIFY_BACKEND_READ_WRITE` pointing to test DB)
