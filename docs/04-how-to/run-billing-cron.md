---
title: Run Billing Cron
sidebar_position: 7
---

# How To: Run the Billing Cron

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## What the Billing Cron Does

The billing cron processes usage-based charges for merchants on the **Growth plan**. Actual logic (`controllers/billing.js → processWeeklyBilling`):

1. Finds subscriptions matching `{ status: 'ACTIVE', plan: 'Growth' }` (there is **no** `billingCycleEnd <= now` filter).
2. For each subscription:
   - Computes a billing window and skips if a transaction already exists for that window.
   - Counts orders in the period from MongoDB.
   - Creates a Shopify Usage Record using the **full** order count (there is **no** free-tier deduction).
   - Increments `consumedAmount` by the order count. Cycle dates are **not** advanced.
   - Inserts a `transactions` document.

> **Known issues** (see the Billing Reference for detail): the orders query filters on a non-existent `orders.storeId` field (the model keys on `shop`), so the count is effectively zero; the `status: 'ACTIVE'` filter is uppercase while the schema enum is lowercase; and the inserted transactions document does not match the `transactions` schema and would fail validation.

---

## Scheduled Execution

The billing cron is scheduled externally (FIK) and runs as a separate Kubernetes Job (not the web server) via the cron entrypoint:

```yaml
# In FIK config
mode: cron
cronJob:
  jobType: billing_trigger
```

Supported `CRON_JOB` / `jobType` values (`cron/index.js`):

| Job type | Behavior |
|----------|----------|
| `billing_trigger` | Run `processWeeklyBilling()` |
| `billing_trigger_last_day` | Run `processWeeklyBilling()` — end-of-month variant |
| `test_cron_job` | No-op; logs success (smoke test) |

---

## Manual Trigger

### Option 1: Via API (no server restart needed)

```bash
GET https://shopify-backend.extensions.fynd.com/config/billingCron
```

This runs the billing logic inline and returns when complete.

### Option 2: Via Environment Variables (local)

```bash
MODE=cron CRON_JOB=billing_trigger node server.js
```

Starts the cron process locally, runs the configured job, and exits.

---

## Monitoring a Cron Run

1. Check logs during the run. Representative lines emitted by `controllers/billing.js` and `cron/index.js`:
   ```
   [info] Usage record created successfully
   [info] Updated subscription consumed amount
   [info] Billing cron executed successfully for billing_trigger
   [info] Cron job execution completed
   ```

2. Check Sentry for errors (project: `shopify-backend`).

3. Verify in MongoDB — newly written transactions for the period:
   ```javascript
   db.transactions.find({
     billingStart: { $gte: new Date('2026-06-10') }
   })
   ```

---

## Debugging Billing Issues

### Subscription not being billed

1. Check MongoDB:
   ```javascript
   db.subscriptions.findOne({ shop: "my-store.myshopify.com" })
   ```
2. The cron only selects `{ status: 'ACTIVE', plan: 'Growth' }`. There is no `billingCycleEnd` gate, so a subscription is processed every run unless a transaction already exists for the computed window.
   > Note: the cron filters on the literal uppercase `status: 'ACTIVE'`, which does not match the schema's lowercase `active` enum value — see the Known issues above.

### Usage record creation failed

The Shopify Billing API can fail if:
- Subscription was cancelled by merchant
- Shop was uninstalled
- Shopify API rate limit hit
- The stored `subscriptionId` is not in Shopify's `activeSubscriptions` (the controller attempts a self-heal first)

Check Sentry for usage-record errors.

### Orders not counted correctly

The `orders` model keys on `shop` (and `orderId`), not `storeId`. To inspect orders for a shop and period:
```javascript
db.orders.find({
  shop: "my-store.myshopify.com",
  createdAt: {
    $gte: ISODate("2026-06-10"),
    $lt: ISODate("2026-06-17")
  }
}).count()
```
> The billing controller currently queries `orders.find({ storeId: store._id, ... })`. Because there is no `storeId` field on the `orders` documents, this returns no orders — a known bug. Use `shop` (as above) when verifying counts manually.
