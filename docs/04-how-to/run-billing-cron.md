---
title: Run Billing Cron
sidebar_position: 7
---

# How To: Run the Billing Cron

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## What the Billing Cron Does

The billing cron processes usage-based charges for all merchants on the **Growth plan**. It runs weekly and:

1. Finds all active subscriptions where `billingCycleEnd <= now`
2. For each subscription:
   - Counts orders in the billing period from MongoDB
   - Deducts the 50-order free tier
   - Creates a Shopify Usage Record for billable orders (₹1 each)
   - Advances the billing cycle dates

---

## Scheduled Execution

The billing cron is configured in FIK to run automatically:

**Schedule:** `0 0 7,14,21,28 * *`

This means: midnight on the 7th, 14th, 21st, and 28th of every month.

The cron runs as a separate Kubernetes Job (not the web server):
```yaml
# In FIK config (fik-fynd-extensions/environments/fynd/m2/projects/shopify-app.yaml)
mode: cron
cronJob:
  schedule: "0 0 7,14,21,28 * *"
  jobType: billing_trigger
```

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

Starts the cron process locally, processes all pending billing, and exits.

---

## Monitoring a Cron Run

1. Check logs during the run:
   ```
   [info] Starting billing cron: billing_trigger
   [info] Processing subscription for shop: my-store.myshopify.com, plan: Growth
   [info] Orders in period: 127, free tier: 50, billable: 77
   [info] Created usage record: gid://shopify/AppUsageRecord/123
   [info] Billing cron complete. Processed 12 stores.
   ```

2. Check Sentry for errors (project: `shopify-backend`)

3. Verify in MongoDB:
   ```javascript
   db.subscriptions.find({
     billingCycleStart: { $gt: new Date('2026-03-21') }
   })
   ```

---

## Debugging Billing Issues

### Subscription not being billed

1. Check MongoDB:
   ```javascript
   db.subscriptions.findOne({ shop: "my-store.myshopify.com" })
   ```
2. Verify `status === "active"` and `billingCycleEnd <= now`
3. If cycle end is in the future, billing won't trigger yet

### Usage record creation failed

The Shopify Billing API can fail if:
- Subscription was cancelled by merchant
- Shop was uninstalled
- Shopify API rate limit hit

Check Sentry for `AppUsageRecordCreateFailed` errors.

### Orders not counted correctly

Check the `orders` collection:
```javascript
db.orders.find({
  shop: "my-store.myshopify.com",
  createdAt: {
    $gte: ISODate("2026-03-14"),
    $lte: ISODate("2026-03-21")
  }
}).count()
```
