---
title: Billing Reference
sidebar_position: 5
---

# Billing Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

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

The Promise subscription plan string used by the billing cron is **`Growth`** (see `controllers/billing.js`, which filters subscriptions on `plan: 'Growth'`). Billing is usage-based (₹1 per order, ₹999/mo cap), driven by `appUsageRecordCreate`.

### Fynd Logistics (shopify-logistics-app)

Logistics uses a separate plan model stored on the `logistics` document at `plan.name`, with values **`FREE`** / **`PAID`** (uppercase). The default plan for a newly registered merchant is **`PAID`** (`configs/logistics.config.js → DEFAULT_PLAN`). The FREE-tier free fulfillment limit is **5** (`FREE_PLAN_FULFILLMENT_LIMIT = 5`), not 50.

---

## Free Tier Enforcement (Logistics)

The `fulfillmentLimitCheck` middleware (`middlewares/fulfillmentLimitCheck.js`) enforces the FREE-plan fulfillment limit. It reads counters from the `logistics.plan` sub-document (`fulfillmentLimit` / `fulfillmentsUsed`) — **not** from the `orders` collection.

Behavior:

1. Read-only methods (`GET`/`HEAD`/`OPTIONS`) always pass; plan info is attached to `req.planInfo`.
2. `PAID` plan → unlimited fulfillments, always passes.
3. `FREE` plan → `remaining = fulfillmentLimit - fulfillmentsUsed`.
   - If `remaining <= 0` → HTTP **403** with `errorCode: FULFILLMENT_LIMIT_REACHED`, **and the shop is auto-disabled** (`logistics.enabled = false`, `plan.autoDisabledReason = 'LIMIT_EXHAUSTED'`).
   - If the projected count for the request exceeds `remaining` → HTTP **403** with `errorCode: FULFILLMENT_REQUEST_EXCEEDS_REMAINING_QUOTA`.

Applied to write requests on:
- `/fulfill/orders/bulk`
- `/fulfill/fulfillment`
- any path matching `/fulfill/orders/`

Excluded: `/fulfill/fulfillment/carrier-assignment-status` (treated as read-only).

> The default FREE plan does not apply on registration since `DEFAULT_PLAN` is `PAID`; FREE applies only to merchants whose `logistics.plan.name` is explicitly set to `FREE`.

---

## Billing Cycle

The billing cron is scheduled externally (FIK), roughly weekly.

### Billing Cron Process (actual logic — `controllers/billing.js`)

```
1. Find subscriptions in MongoDB WHERE { status: 'ACTIVE', plan: 'Growth' }
   (no billingCycleEnd <= now filter)
2. For each subscription:
   a. Compute billing window [start, end] (start = last billingEnd or createdAt; end = start)
   b. Skip if a transaction already exists for { subscriptionId, billingStart, billingEnd }
   c. Load store + promise Shopify token (skip if missing)
   d. Count orders: orders.find({ storeId: store._id, createdAt: [start, end) })
   e. Apply usage to Shopify: appUsageRecordCreate with
      price.amount = orderCount (full count — NO free-tier deduction),
      description = "Weekly billing usage record" (hardcoded)
   f. Update subscription.consumedAmount += orderCount
      (cycle dates are NOT advanced)
   g. Insert a transactions doc
3. Return billing summary { successful, failed, skipped }
```

> **Known issue:** The orders query filters on `orders.storeId`, but the `orders` model has no `storeId` field (it keys on `shop` + `orderId`). As written, this matches no orders, so `orderCount` is effectively `0`.

> **Known issue:** The subscriptions filter uses `status: 'ACTIVE'` (uppercase) while the `subscriptions` schema enum is lowercase (`active`/`cancelled`/`expired`/`uninstalled`). The webhook writes the Shopify status value verbatim (uppercase `ACTIVE`), so this filter only matches docs written via that path, not schema-conformant ones.

> **Known issue:** The transactions document created here sets `plan`, `consumedAmount`, and `approvedAmount` — fields that do not exist on the `transactions` schema — and omits the schema-required `applicationType`, `billingId`, and `totalAmount`. Inserting this document would fail schema validation.

### Triggering Manually

For debugging, the billing cron can be triggered via:
```
GET /config/billingCron
```

Or by running the cron entrypoint with `MODE=cron CRON_JOB=billing_trigger node server.js`.

---

## Subscription Lifecycle

The `subscriptions` schema status enum is **lowercase**: `active`, `cancelled`, `expired`, `uninstalled` (note the `uninstalled` value). Date/amount fields are camelCase: `billingCycleStart`, `billingCycleEnd`, `subscribedAt`, `consumedAmount`.

```
App installed
    ↓
Merchant approves subscription on Shopify
    ↓
Shopify webhook: app_subscriptions/update (status=ACTIVE)
    ↓
Backend validates the subscription against Shopify activeSubscriptions,
then upserts the subscription record (status, plan, approvedAmount,
subscriptionId, test flag)
    ↓
[Normal operation: orders processed]
    ↓
[Billing cron runs]
    ↓
[App uninstalled OR subscription cancelled]
    ↓
Shopify webhook: app/uninstalled / app_subscriptions/update (status=CANCELLED)
    ↓
Store deactivated and/or subscription marked cancelled
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

## Checking / Creating Subscription via API

```
POST /config/subscription
Body: { shop: "my-store.myshopify.com", appType: "promise", subscriptionId: "..." }
```

Handled by `controllers/subscriptions.js → subscriptionDetails`.

---

## Test Mode

Test mode is driven by Shopify's own `test` flag, not by `NODE_ENV`. When a subscription is created/approved in Shopify with `test: true`, the backend reads that flag via GraphQL (`activeSubscriptions { test }`) and persists it as the `test` boolean on the `subscriptions` model. There is no `TEST_MODE` constant or `web/billing.js` config in `shopify-backend`.
