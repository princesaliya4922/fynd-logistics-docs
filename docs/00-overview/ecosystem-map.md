---
title: Ecosystem Map
sidebar_position: 2
---

# Ecosystem Map

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

This page maps the full Fynd Shopify system: runtime components, deployment control plane, observability, and analytics pipeline.

---

## Whole System Diagram

```mermaid
flowchart LR
    Merchant[Merchant]
    Customer[Customer]

    subgraph Shopify[Shopify Platform]
        Admin[Admin UI + App Bridge]
        AdminAPI[Admin API]
        BillingAPI[Billing API]
        Webhooks[Webhook Delivery]
    end

    subgraph Apps[Fynd Shopify Apps]
        Promise[shopify-pincode-checker]
        Logistics[shopify-logistics-app]
        Backend[shopify-backend]
    end

    subgraph Ext[Shopify Extensions]
        Checkout[fynd-promise-checkout]
        PDP[fynd-promise-pdp]
        OrderBlock[fullfillment-extension]
    end

    subgraph Data[Data Stores]
        SQLite[(SQLite)]
        Redis[(Redis)]
        Mongo[(MongoDB)]
    end

    subgraph Fynd[Fynd Platform]
        Central[Central APIs]
        FLP[FLP Platform]
        Serviceability[Serviceability APIs]
        FyndHooks[Fynd/FLP Webhooks]
    end

    subgraph Analytics[Analytics Pipeline]
        Transform[transformations]
        BQ[(BigQuery)]
        DLQ[(BQ DLQ)]
    end

    Merchant --> Admin
    Admin --> Promise
    Admin --> Logistics
    Customer --> Checkout
    Customer --> PDP
    Merchant --> OrderBlock

    Promise --> Backend
    Logistics --> Backend
    Checkout --> Backend
    PDP --> Backend
    OrderBlock --> Backend

    Webhooks --> Backend
    Backend --> AdminAPI
    Backend --> BillingAPI
    Backend --> Central
    Backend --> FLP
    Backend --> Serviceability
    FyndHooks --> Backend

    Promise --- SQLite
    Logistics --- Redis
    Backend --- Redis
    Backend --- Mongo
    Mongo --> Transform --> BQ
    Transform --> DLQ
```

---

## Runtime Component Map

```mermaid
graph LR
    subgraph ShopifyPlatform[Shopify Platform]
        SAdmin[Merchant Admin Browser]
        SStorefront[Customer Storefront Browser]
        SWebhooks[Shopify Webhooks]
        SBillingAPI[Shopify Billing API]
    end

    subgraph FyndApps[Fynd Shopify Apps]
        PromiseFE[Fynd Promise Frontend\nshopify-pincode-checker]
        LogisticsFE[Fynd Logistics Frontend\nshopify-logistics-app]
        Backend[Shared Backend\nshopify-backend]
    end

    subgraph ShopifyExtensions[Shopify Extensions]
        CheckoutExt[Checkout UI Extension\nfynd-promise-checkout]
        PDPExt[Theme Extension\nfynd-promise-pdp]
        OrderBlockExt[Admin UI Extension\nfullfillment-extension]
        ReturnsExt[Admin UI Extension\nfynd-returns]
    end

    subgraph Fynd[Fynd Platform]
        Central[Fynd Central API]
        FLP[FLP Platform]
        ServiceAPI[Serviceability API]
        FDKWebhooks[Fynd Webhooks]
    end

    subgraph DataLayer[Data Layer]
        Mongo[(MongoDB)]
        Redis[(Redis)]
        BQ[(BigQuery)]
    end

    SAdmin --> PromiseFE
    SAdmin --> LogisticsFE
    SStorefront --> CheckoutExt
    SStorefront --> PDPExt
    SAdmin --> OrderBlockExt
    SAdmin --> ReturnsExt

    PromiseFE --> Backend
    LogisticsFE --> Backend
    CheckoutExt --> Backend
    PDPExt --> Backend
    OrderBlockExt --> Backend
    ReturnsExt --> Backend

    SWebhooks --> Backend
    SBillingAPI <--> Backend

    Backend <--> Central
    Backend <--> FLP
    Backend <--> ServiceAPI
    FDKWebhooks --> Backend

    Backend --- Mongo
    Backend --- Redis
    Mongo -.-> BQ
```

---

## Repository to Runtime Ownership

| Repository | Deploys | Runtime Responsibility |
|-----------|---------|------------------------|
| `shopify-pincode-checker` | Promise embedded app + extension assets | Promise onboarding and customer-facing promise widgets |
| `shopify-logistics-app` | Logistics embedded app + admin extension assets | Logistics onboarding and manual fulfillment/returns actions |
| `shopify-backend` | Shared API + cron | Webhooks, fulfillment orchestration, billing, serviceability APIs |
| `fik-fynd-extensions` | Kubernetes manifests + env overlays | Environment-specific deployment and secret wiring |
| `transformations` | Zenith jobs | MongoDB -> BigQuery transformation and sync |

---

## Data Ownership Map

| Data | Owned By | Stored In |
|------|----------|-----------|
| Shopify sessions (Promise) | Promise app server | SQLite |
| Shopify sessions (Logistics) | Logistics app server | Redis |
| Merchant/store config | backend | MongoDB `stores` |
| Logistics setup | backend | MongoDB `logistics` + related collections |
| Shipments | backend | MongoDB `shipments` |
| Returns | backend | MongoDB `returns` |
| Billing/subscriptions | backend | MongoDB `subscriptions`, `transactions`, `orders` |
| Analytics tables | transformation pipeline | BigQuery `fynd_zenith_data.*` |

---

## Critical Runtime Flows

### Flow A: Customer Pincode Check

```mermaid
sequenceDiagram
    participant C as Customer
    participant Ext as Checkout/PDP Extension
    participant B as shopify-backend
    participant M as MongoDB
    participant S as Serviceability API

    C->>Ext: Enter pincode
    Ext->>B: POST /location/service
    B->>M: Read store config + mappings
    B->>S: Check serviceability
    S-->>B: serviceable + promise window
    B-->>Ext: response
    Ext-->>C: Show promise or failure reason
```

### Flow B: Order to Fulfillment

```mermaid
sequenceDiagram
    participant Shopify as Shopify Webhooks
    participant B as shopify-backend
    participant M as MongoDB
    participant FLP as FLP Platform

    Shopify->>B: orders/create webhook
    B->>B: Verify HMAC + validate app secret
    B->>M: Check store/logistics eligibility
    B->>FLP: Create shipment
    FLP-->>B: shipment created
    B->>M: Persist shipment record
    FLP->>B: Shipment status webhook
    B->>M: Update shipment state
    B->>Shopify: Update fulfillment tracking/status
```

### Flow C: Auth and Trust Boundaries

```mermaid
sequenceDiagram
    participant Browser as Shopify Embedded Frontend
    participant App as Promise/Logistics Node App
    participant Backend as shopify-backend
    participant Shopify as Shopify Platform

    Browser->>App: /api/* with session token (JWT)
    App->>App: validateAuthenticatedSession
    App->>Backend: Forward request + x-api-key
    Backend->>Backend: Verify session JWT + route auth
    Shopify->>Backend: webhook + X-Shopify-Hmac-Sha256
    Backend->>Backend: Verify HMAC via app-specific secret
```

### Flow D: Retry and Idempotency

```mermaid
flowchart TD
    A[Shopify/FLP webhook delivered] --> B[Process event in backend]
    B --> C{Already processed?}
    C -- Yes --> D[Return 200 and skip]
    C -- No --> E[Apply business logic]
    E --> F{Success?}
    F -- Yes --> G[Persist state transition]
    F -- No --> H[Return non-2xx]
    H --> I[Provider retries delivery]
    I --> A
```
