---
title: Data Flow
sidebar_position: 7
---

# End-to-End Data Flow

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

This document traces the main lifecycle flows across Shopify, Fynd services, and internal data stores.

---

## Flow 1: App Installation (OAuth + Bootstrap)

```mermaid
sequenceDiagram
    participant Merchant
    participant Shopify
    participant App as Promise/Logistics App Server
    participant Backend as shopify-backend
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
    participant Backend as shopify-backend
    participant Mongo as MongoDB
    participant Shopify as Shopify Admin API

    Merchant->>PromiseFE: Open app settings
    PromiseFE->>Backend: GET /api/shop
    Backend->>Shopify: Fetch shop details
    Backend-->>PromiseFE: Region + shop metadata

    PromiseFE->>Backend: POST /api/subscription
    Backend->>Mongo: Read/create subscription
    Backend-->>PromiseFE: Active plan state

    PromiseFE->>Backend: GET /api/locations
    Backend->>Mongo: Lookup storeMappings
    alt mapping exists
        Backend-->>PromiseFE: Existing setup
    else first-time setup
        Backend->>Shopify: Fetch locations
        Backend-->>PromiseFE: Shopify locations
    end

    Merchant->>PromiseFE: Update promise config
    PromiseFE->>Backend: POST /api/updateConfig
    Backend->>Mongo: Persist delivery settings
    Backend-->>PromiseFE: Updated config
```

---

## Flow 3: Customer Checks Pincode (PDP/Checkout)

```mermaid
sequenceDiagram
    participant Customer
    participant Ext as Theme/Checkout Extension
    participant Backend as shopify-backend
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

### Failure Path

- Invalid pincode -> 4xx validation response (no external API call).
- Serviceability timeout/error -> fallback message shown to customer.

---

## Flow 4: Order Creation to Fulfillment

```mermaid
sequenceDiagram
    participant Shopify as Shopify Webhooks
    participant Backend as shopify-backend
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

### Idempotency and Retries

- Duplicate webhook deliveries are expected; handlers must be idempotent.
- FLP updates are processed as status transitions; stale transitions should be ignored.

---

## Flow 5: Billing Cycle

```mermaid
flowchart TD
    A[Cron trigger on 7th/14th/21st/28th] --> B[Load active subscriptions]
    B --> C{Subscription due for billing?}
    C -- No --> D[Skip]
    C -- Yes --> E[Count billable orders in cycle]
    E --> F{Orders > free tier?}
    F -- No --> G[Advance billing window only]
    F -- Yes --> H[Create Shopify usage record]
    H --> I{Usage API success?}
    I -- Yes --> J[Update consumed amount + cycle window]
    I -- No --> K[Log error and mark for retry/manual run]
    D --> L[Next subscription]
    G --> L
    J --> L
    K --> L
```

### Operational Notes

- Manual trigger: `GET /config/billingCron`.
- Billing correctness depends on `orders.is_billed` and cycle window calculations.

---

## Flow 6: MongoDB to BigQuery (Zenith)

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

- Synced collections include `stores`, `orders`, `subscriptions`, `productMappings`, `storeMappings`, `courierPartners`.
- `shipments` and `returns` are not yet synced (tracked in known gaps).

---

## Cross-Flow Invariants

1. `shop` (`*.myshopify.com`) is the primary tenant key across flows.
2. HMAC/session validation is enforced before business logic.
3. Write paths are MongoDB-first; analytics is eventual via pipeline sync.
4. All webhook and cron handlers should be safe to replay.
