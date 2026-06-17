---
title: Configure Delivery Promise
sidebar_position: 6
---

# How To: Configure Delivery Promise

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

How to configure the delivery promise settings that determine what customers see.

---

## Promise View Options

The `promiseView` setting controls how the delivery date is displayed. The default is `range`. The settings UI (`StepProgress.jsx`) offers three options — there is **no `fixed`** option in the app:

| Value | Title (in UI) | Meaning |
|-------|---------------|---------|
| `range` | Date Range | A delivery window, e.g. "Delivery by Mon 25 Mar – Wed 27 Mar" |
| `min` | Minimum Limit | Earliest expected delivery date |
| `max` | Maximum Limit | Latest expected delivery date |

---

## Delivery Preference

The app submits `deliveryPreference` to the backend (default value is the string `'1'`). How it maps to a promise-calculation algorithm is **backend-owned** and not confirmable from this app repo.

---

## Configuration via Promise App

1. Open Fynd Promise app in Shopify Admin
2. Navigate to **Settings**
3. In **Delivery Widget**:
   - Select **Warehouse location**
   - Select **Promise view** (Date Range / Minimum Limit / Maximum Limit)
   - Set **Processing time** (e.g., 1 day)
4. Click **Save**

When you save, the app sends the configuration to the backend via `POST ${BACKEND_URL}/config/merchant` (the app injects `shop` server-side). The persistence of these values (e.g. into MongoDB collections such as `stores.deliveryPreference` / `stores.promiseView` / `storeMappings`) is **backend-owned** and not confirmable from this app repo.

---

## Configuration via Logistics App

The logistics app also has delivery promise settings in the setup form:

1. In **FyndSetup** form:
   - **Delivery Promise** section
   - Toggle: **Range** or **Fixed**
   - If Range: set min/max days (e.g., 2–4 days)
   - If Fixed: set exact days (e.g., 3 days)

---

## Promise Calculation Logic

> The promise calculation runs entirely in the central Fynd backend (backend-owned). The steps below describe expected backend behavior and are not implemented in the `shopify-pincode-checker` app repo.

When a customer checks a pincode:

1. Backend fetches `storeMappings` for the shop → gets `processingTime`, `cut_off_time`
2. Checks current time vs `cut_off_time`:
   - If before cut-off: calculation starts from today
   - If after cut-off: calculation starts from tomorrow
3. Adds `processingTime` days (packing time)
4. Calls Fynd Serviceability API with pincode + effective dispatch date
5. Fynd returns the delivery window based on courier SLA for that pincode

---

## Cut-Off Time

The `cut_off_time` in `storeMappings` is the daily deadline for order dispatch.

Example: `cut_off_time = "15:00"`
- Order received at 2:00 PM → dispatched today → promise starts tomorrow
- Order received at 4:00 PM → dispatched tomorrow → promise starts day after

---

## Updating Promise Settings via API

> The endpoints in this section are **backend / logistics service** endpoints (not routes in the `shopify-pincode-checker` app). The app itself only writes config via `POST ${BACKEND_URL}/config/merchant`.

```bash
POST /config/fyndPromise
Content-Type: application/json
x-api-key: <base_api_key>

{
  "shop": "my-store.myshopify.com",
  "promiseView": "range",
  "deliveryPreference": "standard",
  "courierPartners": ["partner-id-1", "partner-id-2"]
}
```

---

## Promise Courier Partners (Admin)

> These `PATCH /logistics/admin/...` routes are **backend / logistics service** endpoints, not part of the Promise app.

Admins can configure which courier partners are used for promise calculations:

```bash
PATCH /logistics/admin/api/promise/stores/:shop/courier-partners
Authorization: Basic <credentials>

{
  "courierPartnerIds": ["cp-id-1", "cp-id-2"]
}
```

And toggle the promise view:
```bash
PATCH /logistics/admin/api/promise/stores/:shop/promise-view
{
  "promiseView": "range"
}
```
