---
title: Fynd Logistics — Product Overview
sidebar_position: 2
---

# Fynd Logistics — Product Overview

> **Owner:** Product & Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## What Is Fynd Logistics?

**Fynd Logistics** is a Shopify app that connects Shopify orders to Fynd's fulfillment network for end-to-end logistics management.

**The problem it solves:**
Indian Shopify merchants need to manage order fulfillment, courier assignments, shipment tracking, and returns — often juggling multiple courier integrations. Fynd Logistics replaces all of this with a single integration.

**The solution:**
When a customer places an order on Shopify, Fynd Logistics automatically creates a shipment in Fynd's logistics platform (FLP), assigns the best available courier, generates shipping labels, and tracks the package to delivery.

---

## Target Merchants

- Indian Shopify merchants who want to use Fynd's fulfillment network
- Merchants currently on Fynd's platform (seller.fynd.com) who also run a Shopify store
- Merchants looking for automated, hands-off fulfillment

---

## Key Value Propositions

| Value | How |
|-------|-----|
| Automated fulfillment | Orders → shipments without manual intervention |
| Multi-courier | FLP selects cheapest or fastest courier automatically |
| Unified tracking | Shipment status visible in Shopify Admin order page |
| Returns management | Initiate and track returns from Shopify Admin |
| Existing Fynd accounts | Link your existing Fynd company with OTP — no re-registration |

---

## User Journey (Merchant)

```
1. Merchant installs Fynd Logistics from Shopify App Store
2. Links their existing Fynd company via email OTP
   (or creates a new company)
3. Maps Shopify warehouse locations to Fynd locations
4. Configures preferences (processing time, shipping preference)
5. Orders from customers are now automatically fulfilled via Fynd
6. Merchant views fulfillment status in Shopify Admin order page
7. For returns: merchant initiates via the Returns block in order page
```

---

## User Journey (End Customer)

```
1. Customer places order on merchant's Shopify store
2. Order is automatically sent to Fynd's logistics platform
3. Fynd assigns a courier (e.g., Delhivery, BlueDart)
4. Merchant gets notified of AWB number
5. Customer receives tracking updates
6. Package delivered
7. If return needed: merchant initiates, courier picks up from customer
```

---

## Business Metrics

- **Free plan:** First 50 fulfillments/month are free
- **Growth plan:** ₹1 per fulfillment (usage-based, ₹999 cap/month)
- Billed via Shopify billing (weekly cycle)

---

## Integration Points

| Touch Point | What Happens |
|-------------|-------------|
| Order creation (Shopify webhook) | Automatically creates FLP shipment |
| Fulfillment status updates (FLP webhook) | Updates Shopify fulfillment + merchant view |
| Admin order details page | Fynd Fulfillment block shows status, AWB, tracking |
| Admin order details page | Fynd Returns block for return initiation |
| Admin app (Shopify) | Setup, location mapping, preferences, billing |

---

## Fulfillment Engines

The backend supports two fulfillment modes:

| Engine | Description |
|--------|-------------|
| **FLP** (default) | Fynd Logistics Platform — standard fulfillment via FLP API |
| **OMS** | Fynd Order Management System — alternative for select merchants |

The engine is configured per-store in the admin dashboard.

---

## Account Linking

Merchants who already have a Fynd company account can link it without creating a new account. The OTP-based link flow:
1. Merchant enters their Fynd company email
2. OTP sent to that email
3. Merchant verifies OTP
4. Their Fynd companies appear for selection
5. They select company + sales channel
6. Setup continues

This prevents duplicate company registrations for merchants already on the Fynd platform.

---

## Limitations

- **India only** — Fynd's logistics network covers India only
- **Fynd network coverage** — Serviceability depends on which areas Fynd's courier partners cover
- **No COD support yet** — Cash on delivery requires additional setup
- **Extension deployment** — Admin UI extensions must be deployed before they appear on order pages
