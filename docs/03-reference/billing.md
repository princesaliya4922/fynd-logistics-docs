---
title: Billing Reference
sidebar_position: 5
---

# Billing Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How billing works for both Fynd Promise and Fynd Logistics.

---

## Billing Model

Both apps use **Shopify usage-based billing** — merchants are charged based on actual usage (orders/fulfillments), not a flat monthly fee.

### How Shopify Usage Billing Works

1. Merchant installs the app → prompted to approve a billing plan
2. The app creates a `AppSubscription` on Shopify (via GraphQL API)
3. The subscription includes a `AppUsagePricingInput` with `cappedAmount` (max monthly charge)
4. As merchants use the app, the backend creates `AppUsageRecord` events via Shopify API
5. Shopify aggregates usage records and charges the merchant on their billing cycle

---

## Plans

### Fynd Promise (shopify-pincode-checker)

Defined in `web/billing.js`:

| Plan | Per-Month Cap | Rate | Free Tier |
|------|--------------|------|-----------|
| Free | ₹1.00 | ₹0 (up to 50 orders) | 50 orders/month |
| Growth | ₹999.00 | ₹1 per order | 50 orders/month |

**Plan details (from code):**
```javascript
export const billingConfig = {
  "Free": {
    amount: 1.0,
    currencyCode: "INR",
    interval: BillingInterval.Usage,
    usageTerms: "Free upto 50 orders."
  },
  "Growth": {
    amount: 999.0,
    currencyCode: "INR",
    interval: BillingInterval.Usage,
    usageTerms: "1 INR per order."
  }
}
```

### Fynd Logistics (shopify-logistics-app)

Same plan structure — Free (50 fulfillments/month) and Growth (₹1/fulfillment, ₹999 cap).

---

## Free Tier Enforcement

The `fulfillmentLimitCheck` middleware (in `shopify-backend`) enforces the free tier limit:

1. Counts orders/fulfillments in the current billing period from MongoDB `orders` collection
2. If count ≥ 50 and plan is `"Free"` → returns HTTP 402 with `LIMIT_EXCEEDED` error
3. Merchant must upgrade to Growth plan to continue

This middleware is applied to:
- `POST /logistics/fulfill/orders/:orderId`
- `POST /logistics/fulfill/orders/bulk`

---

## Billing Cycle

The billing cron job runs on the **7th, 14th, 21st, and 28th** of each month (roughly weekly).

### Billing Cron Process

```
1. Find all subscriptions in MongoDB WHERE status=active AND billingCycleEnd <= now
2. For each subscription:
   a. Count orders: MongoDB orders WHERE shop=X AND createdAt IN [cycleStart, cycleEnd]
   b. Calculate billable orders: max(0, total - 50) [free tier deduction]
   c. Calculate amount: billableOrders × ₹1
   d. If amount > 0:
      POST Shopify GraphQL: appUsageRecordCreate
      {
        subscriptionLineItemId: <lineItemId>,
        price: { amount: billableOrders, currencyCode: "INR" },
        description: "Fynd Promise usage: {billableOrders} orders"
      }
   e. Update MongoDB subscription:
      billingCycleStart = now
      billingCycleEnd = now + 7 days
      consumedAmount += amount
3. Log billing summary
4. Process exits
```

### Triggering Manually

For debugging, the billing cron can be triggered via:
```
GET /config/billingCron
```

Or by running the server with `MODE=cron CRON_JOB=billing_trigger`.

---

## Subscription Lifecycle

```
App installed
    ↓
Merchant approves subscription on Shopify
    ↓
Shopify webhook: app_subscriptions/update (status=active)
    ↓
MongoDB: subscriptions.status = "active"
         subscriptions.billingCycleStart = now
         subscriptions.billingCycleEnd = now + 7 days
    ↓
[Normal operation: orders processed]
    ↓
[Billing cron: every 7 days]
    ↓
[App uninstalled]
    ↓
Shopify webhook: app/uninstalled
    ↓
MongoDB: stores.isActive = false
         subscriptions.status = "cancelled"
```

---

## Frontend Billing Components

### In shopify-pincode-checker

| Component | Purpose |
|-----------|---------|
| `billing/Pricing.jsx` | Shows plan comparison table with upgrade CTAs |
| `billing/BillingBanner.jsx` | Banner showing current plan + usage |
| `billing/Banner.jsx` | Promotional banner for free users |
| `billing/index.jsx` | Billing page wrapper |

### In shopify-logistics-app

Similar structure with same plans.

---

## Checking Subscription Status via API

```
POST /api/subscription
Body: { shop: "my-store.myshopify.com", appType: "promise" }

Response:
{
  "active": true,
  "plan": "Growth",
  "ordersUsed": 127,
  "billingCycleStart": "2026-03-14T00:00:00Z",
  "billingCycleEnd": "2026-03-21T00:00:00Z"
}
```

---

## Test Mode

In `NODE_ENV=development`, Shopify billing uses **test mode** — no real charges are made. All billing operations use Shopify's test billing API which simulates the full flow without actual payment.

From `billing.js`:
```javascript
// In test mode, all transactions are free
const TEST_MODE = process.env.NODE_ENV !== 'production'
```
