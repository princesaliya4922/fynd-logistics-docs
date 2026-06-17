---
title: Fynd Logistics — Product Overview
sidebar_position: 2
---

# Fynd Logistics — Product Overview

> **Owner:** Product & Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## What Is Fynd Logistics?

**Fynd Logistics** is a Shopify app that connects Shopify orders to Fynd's fulfillment network for end-to-end logistics management.

> **Naming:** "Fynd Logistics" is the internal/product name. The published production Shopify app name is **"Fynd Ship"** (`shopify.app.fynd-logistics-prod.toml`). Merchants installing from the App Store see it as **Fynd Ship**.

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
| Returns management | Merchant-initiated returns, customer-requested returns (request/approve/decline), return cancellation, and carrier-assignment tracking — all from Shopify Admin |
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

Plans are **FREE** and **PAID**, billed via Shopify billing.

- **Free plan:** limited to **5** fulfillments (current backend config); beyond the limit the backend returns HTTP 403 and the merchant is prompted to upgrade.
- **Paid plan:** usage-based fulfillment billing.

> Plan tiers, limit values, and enforcement are **backend/billing-config values** in `shopify-backend` — the app's `/api/plan` and `/api/billing` endpoints are pass-throughs and the app does **not** implement limits. The backend billing config is the source of truth.

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

## Returns Scope

Fynd Logistics handles the full returns lifecycle, not just merchant-initiated returns:

- **Merchant-initiated returns** — from the Fynd Returns block on the order page (can return multiple items/fulfillments at once).
- **Customer-requested returns** — driven by Shopify return webhooks: `returns/request`, `returns/approve`, `returns/decline`.
- **Return cancellation** — via the `returns/cancel` webhook.
- **Carrier-assignment tracking** — return pickups are tracked through carrier-assignment polling.

See [How To: Handle Returns](../04-how-to/handle-returns.md) for the operational detail.

---

## Limitations

- **India only** — Fynd's logistics network covers India only
- **Fynd network coverage** — Serviceability depends on which areas Fynd's courier partners cover
- **No COD support yet** — Cash on delivery requires additional setup
- **Extension deployment** — Admin UI extensions must be deployed before they appear on order pages
