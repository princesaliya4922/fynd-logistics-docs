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
graph TB
    subgraph Clients[Clients]
        Merchant[Merchant in Shopify Admin]
        Customer[Customer on Storefront]
    end

    subgraph Shopify[Shopify Platform]
        ShopifyAdmin[Shopify Admin + App Bridge]
        ShopifyAPI[Admin API]
        ShopifyBilling[Billing API]
        ShopifyWebhooks[Webhook Delivery]
    end

    subgraph Apps[Fynd Shopify Apps]
        PromiseApp[shopify-pincode-checker]
        LogisticsApp[shopify-logistics-app]
        Backend[shopify-backend API]
    end

    subgraph Extensions[Shopify Extensions]
        CheckoutExt[fynd-promise-checkout]
        PDPExt[fynd-promise-pdp]
        FulfillExt[fullfillment-extension]
        ReturnsExt[fynd-returns]
    end

    subgraph Data[State + Storage]
        Mongo[(MongoDB\nshopify_backend)]
        Redis[(Redis)]
        SQLite[(SQLite\nPromise session store)]
    end

    subgraph FyndPlatform[Fynd Platform APIs]
        CentralAPI[Fynd Central API]
        FLP[FLP Platform]
        Serviceability[Serviceability API]
        LogisticsExtAPIs[Courier Extension APIs]
        FDKEvents[Fynd/FLP outbound webhooks]
    end

    subgraph Pipeline[Analytics Pipeline]
        Transform[Zenith transformation scripts]
        BQ[(BigQuery\nfynd_zenith_data)]
        DLQ[(BigQuery DLQ)]
    end

    subgraph Ops[Delivery + Operations]
        Repos[Repos:\nshopify-backend / promise / logistics / fik / transformations]
        CI[Azure Pipelines]
        FIK[FIK deploy configs]
        K8s[Kubernetes ext cluster]
        Sentry[Sentry]
        NewRelic[New Relic]
        Grafana[Grafana/Prometheus]
        PagerDuty[PagerDuty]
    end

    Merchant --> ShopifyAdmin
    Customer --> CheckoutExt
    Customer --> PDPExt
    Merchant --> FulfillExt
    Merchant --> ReturnsExt

    ShopifyAdmin --> PromiseApp
    ShopifyAdmin --> LogisticsApp

    PromiseApp --> Backend
    LogisticsApp --> Backend
    CheckoutExt --> Backend
    PDPExt --> Backend
    FulfillExt --> Backend
    ReturnsExt --> Backend

    Backend --> ShopifyAPI
    Backend --> ShopifyBilling
    ShopifyWebhooks --> Backend

    PromiseApp --- SQLite
    LogisticsApp --- Redis
    Backend --- Mongo
    Backend --- Redis

    Backend --> CentralAPI
    Backend --> FLP
    Backend --> Serviceability
    Backend --> LogisticsExtAPIs
    FDKEvents --> Backend

    Mongo --> Transform
    Transform --> BQ
    Transform --> DLQ

    Repos --> CI
    CI --> FIK
    FIK --> K8s
    K8s --> PromiseApp
    K8s --> LogisticsApp
    K8s --> Backend

    Backend --> Sentry
    PromiseApp --> Sentry
    LogisticsApp --> Sentry
    Backend --> NewRelic
    Backend --> Grafana
    Sentry --> PagerDuty
    Grafana --> PagerDuty
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
