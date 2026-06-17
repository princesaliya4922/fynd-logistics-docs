---
title: Data Flow
sidebar_position: 7
---

# End-to-End Data Flow

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

This document traces the main lifecycle flows across Shopify, Fynd services, and internal data stores.

---

## Flow 1: App Installation (OAuth + Bootstrap)

```mermaid
sequenceDiagram
    participant Merchant
    participant Shopify
    participant App as Promise/Logistics App Server
    participant Backend as backend
    participant Mongo as MongoDB

    Merchant->>Shopify: Install app
    Shopify->>App: /api/auth?shop=...
    App->>Shopify: OAuth redirect
    Shopify-->>App: /api/auth/callback?code=...
    App->>Shopify: Exchange code for token
    Shopify-->>App: Access token
    App->>Backend: POST /config/register
    Backend->>Mongo: Upsert store record
    App->>Shopify: Register webhooks
    App-->>Merchant: Embedded app dashboard
```

### Notes

- Region gating is applied during bootstrap (`country_code === 'IN'`).
- Webhooks are registered per app (`?app=fynd-promise` or `?app=fynd-logistics`).

---

## Flow 2: Merchant Configures Promise App

```mermaid
sequenceDiagram
    participant Merchant
    participant PromiseFE as Promise Frontend
    participant AppServer as Promise App Server
    participant Backend as backend
    participant Mongo as MongoDB
    participant Shopify as Shopify Admin API

    Merchant->>PromiseFE: Open app settings
    PromiseFE->>AppServer: GET /api/shop
    AppServer->>Shopify: Fetch shop details
    AppServer-->>PromiseFE: Region + shop metadata

    PromiseFE->>AppServer: POST /api/subscription
    AppServer->>Mongo: Read/create subscription
    AppServer-->>PromiseFE: Active plan state

    PromiseFE->>AppServer: GET /api/locations
    AppServer->>Mongo: Lookup storeMappings
    alt mapping exists
        AppServer-->>PromiseFE: Existing setup
    else first-time setup
        AppServer->>Shopify: Fetch locations
        AppServer-->>PromiseFE: Shopify locations
    end

    Merchant->>PromiseFE: Update promise config
    PromiseFE->>Backend: POST /config/merchant
    Backend->>Mongo: Persist delivery settings
    Backend-->>PromiseFE: Updated config
```

> **Note:** `/api/shop`, `/api/subscription`, `/api/locations`, and `/api/updateConfig` are **app-server** routes (in the Promise/Logistics web apps), not in `shopify-backend`. The `shopify-backend` config endpoints are: `GET`/`POST /config/merchant`, `POST /config/subscription`, `POST /config/fyndPromise`, `GET /config/shops` (plus `POST /config/register` used during install).

---

## Flow 3: Customer Checks Pincode (PDP/Checkout)

```mermaid
sequenceDiagram
    participant Customer
    participant Ext as Theme/Checkout Extension
    participant Backend as backend
    participant Mongo as MongoDB
    participant Serviceability as Fynd Serviceability API

    Customer->>Ext: Enter pincode
    Ext->>Ext: Validate 6-digit format
    Ext->>Backend: POST /location/service
    Backend->>Mongo: Read store config + location mapping
    Backend->>Serviceability: Check serviceability
    Serviceability-->>Backend: serviceable + promise date/range
    Backend-->>Ext: response payload
    Ext-->>Customer: Show delivery promise (or failure)
```

### Request Body

Per its Swagger definition (`routes/serviceability.js`), `POST /location/service` takes:

```json
{ "pincode": "000000", "shopifyProductId": 987654321, "shopifyShop": "my-shop-name" }
```

(All three fields are required.)

### Failure Path

- Invalid pincode -> 4xx validation response (no external API call).
- Serviceability timeout/error -> fallback message shown to customer.

---

## Flow 4: Order Creation to Fulfillment

```mermaid
sequenceDiagram
    participant Shopify as Shopify Webhooks
    participant Backend as backend
    participant Mongo as MongoDB
    participant FLP as FLP Platform

    Shopify->>Backend: orders/create webhook
    Backend->>Backend: Verify HMAC
    Backend->>Mongo: Check logistics enablement + plan limits
    alt not eligible
        Backend-->>Shopify: 200 (ignored)
    else eligible
        Backend->>Shopify: Fetch fulfillment_orders
        Backend->>Mongo: Create queued shipment record
        Backend->>FLP: Create shipment
        FLP-->>Backend: Shipment created
        Backend->>Mongo: Update status=processing
    end

    FLP->>Backend: shipment update webhook
    Backend->>Mongo: Update shipment status
    Backend->>Shopify: Update fulfillment/tracking
```

### Dual Workflow on `orders/create`

The same `orders/create` webhook serves both billing (promise) and fulfillment (logistics). In `controllers/webhook.controller.js`, the handler calls:

- `subscription.handleOrderCreated(...)` — promise/billing path, gated by `shouldRunPromiseWorkflows` (`!appName || appName === 'fynd-promise'`)
- `processShopifyOrder(...)` — logistics path, gated by `shouldRunLogisticsWorkflows` (`appName === 'fynd-logistics'`) **and** the presence of a `logisticsData` document for the shop

### Idempotency and Retries

- Duplicate webhook deliveries are expected; handlers must be idempotent.
- FLP updates are processed as status transitions; stale transitions should be ignored.

---

## Flow 5: Billing Cycle

```mermaid
flowchart TD
    A[Cron trigger - external FIK schedule] --> B["Load subscriptions (status='ACTIVE', plan='Growth')"]
    B --> C[For each subscription: count orders in cycle window]
    C --> H[Create Shopify usage record]
    H --> I{Usage API success?}
    I -- Yes --> J[Update consumedAmount + write transactions doc]
    I -- No --> K[Log error and mark for retry/manual run]
    J --> L[Next subscription]
    K --> L
```

### Operational Notes

- Manual trigger: `GET /config/billingCron`.
- The cron updates `consumedAmount` on the subscription and writes a `transactions` document. It does **not** apply a free-tier deduction and does **not** advance the billing-cycle window.
- The order-count field is `isBilled` (camelCase) on the orders model, but the cron does **not** read or set `isBilled`.

> **Known issue:** The cron query (`controllers/billing.js`) filters `subscriptions.find({ status: 'ACTIVE', plan: 'Growth' })`, but the model status enum is lowercase (`active`/`cancelled`/`expired`/`uninstalled`), so the uppercase `'ACTIVE'` matches nothing. The order count also uses `orders.find({ storeId, createdAt })`, but the `orders` model has no `storeId` field.

---

## Flow 6: MongoDB to BigQuery (Zenith)

> **External pipeline:** This flow is **out of repo** — there is no BigQuery or sync code in `shopify-backend`. The checked-out `transformations` repo did not contain `shopify_backend` transformation files during the 2026-06-17 audit, so the collection names below should be treated as historical/target scope until the active pipeline location is confirmed.

```mermaid
flowchart TD
    A[MongoDB shopify_backend collections] --> B[Incremental scan by updatedAt]
    B --> C[Run transformation.js]
    C --> D{Transform valid?}
    D -- Yes --> E[Upsert into BigQuery fynd_zenith_data]
    D -- No --> F[Write failed row to DLQ]
    E --> G[Update sync cursor]
    F --> H[Investigate + reprocess DLQ]
```

### Current Scope

- Previously documented collections include `stores`, `orders`, `subscriptions`, `productMappings`, `storeMappings`, `courierPartners`.
- `shipments`, `returns`, and logistics-specific detail collections are not covered by that historical set (tracked in known gaps).

---

## Cross-Flow Invariants

1. `shop` (`*.myshopify.com`) is the primary tenant key across flows.
2. HMAC/session validation is enforced before business logic.
3. Write paths are MongoDB-first; analytics is eventual via pipeline sync.
4. All webhook and cron handlers should be safe to replay.

---

## Flow 7: Fulfillment Cancellation and Shopify Re-Fulfillment Recovery

```mermaid
sequenceDiagram
    participant Shopify as Shopify Webhooks
    participant Backend as backend
    participant Mongo as MongoDB
    participant Fynd as FLP/OMS APIs

    Shopify->>Backend: fulfillments/update (status=cancelled)
    Backend->>Mongo: Resolve shipment + fulfillment_engine
    Backend->>Fynd: Attempt cancellation
    alt cancellation success
        Backend->>Mongo: Mark shipment and shipmentItems cancelled
    else recoverable failure (status 400 OR 422 FLP_CANCEL_AWB_NOT_FOUND)
        Backend->>Mongo: Load original shipment + returned qty context
        Backend->>Backend: Build adjusted line item quantities
        Backend->>Shopify: Create replacement fulfillment (refulfillOnShopify)
        alt re-fulfill success
            Backend->>Mongo: Set refulfilled_shopify=true and update fulfillment ids
        else re-fulfill failure
            Backend->>Mongo: Persist structured REFULFILLMENT_FAILURE error_details
        end
    else non-recoverable failure
        Backend->>Mongo: Keep cancellation failure details for manual ops action
    end
```
