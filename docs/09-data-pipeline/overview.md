---
title: Data Pipeline Overview
sidebar_position: 1
---

# Data Pipeline Overview

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How `shopify-backend` MongoDB data is synced to BigQuery for analytics.

---

## End-to-End Pipeline Diagram

```mermaid
flowchart LR
    A[MongoDB: shopify_backend collections] --> B[Incremental extractor\nupdatedAt > lastSyncTime]
    B --> C[transformation.js\nfield mapping + normalization]
    C --> D{Schema valid?}
    D -- Yes --> E[BigQuery\nfynd_zenith_data.*]
    D -- No --> F[DLQ table\ntemp_zenith_data.dbe_dlq]
    E --> G[Analytics consumers\nLooker/SQL/ops reporting]
    F --> H[Fix transform/schema]
    H --> I[DLQ reprocess via pipeline manager]
    I --> C
```

---

## Pipeline Technology Stack

| Component | Technology |
|-----------|-----------|
| Source | MongoDB (Zenith read replica) |
| Transformation | Node.js JavaScript scripts |
| Orchestrator | Boltic |
| Destination | Google BigQuery |
| Management | `cli_pipeline_manager.js` |
| Failure sink | BigQuery DLQ |

---

## Sync Strategy

Type: incremental sync using `updatedAt` cursor per collection.

```javascript
// transformations/shopify/incremental-columns.js
{
  'mongo.shopify_backend.stores': 'updatedAt',
  'mongo.shopify_backend.orders': 'updatedAt',
  'mongo.shopify_backend.subscriptions': 'updatedAt',
  'mongo.shopify_backend.productMappings': 'updatedAt',
  'mongo.shopify_backend.storeMappings': 'updatedAt',
  'mongo.shopify_backend.courierPartners': 'updatedAt'
}
```

Per run:
1. Read rows where `updatedAt > lastSyncTime`
2. Transform rows to destination schema
3. Upsert into BigQuery using `__boltic_primary_key_columns`
4. Advance sync cursor

---

## Collection Coverage

Synced now:
- `stores`
- `orders`
- `subscriptions`
- `productMappings`
- `storeMappings`
- `courierPartners`

Not synced yet:
- `shipments`
- `returns`
- `logistics`
- `logisticsOrders`
- `logisticsDeliveryPartners`
- `productAccounts`

Details: [Collections Synced](./collections-synced.md)

---

## Transformation Contract

Each collection path:

```text
transformations/shopify/mongo/shopify_backend/<collection>/
├── transformation.js
└── destination-schemas.json
```

Expected `transformRows` output:
- `data`: transformed row array
- `__boltic_primary_key_columns`: upsert key(s)
- `__boltic_partition_columns`: partition field(s)

---

## Data Quality Guards

- Safe date parsing with valid timestamp range checks
- Safe JSON serialization for nested Mongo documents
- Null fallback for malformed or out-of-range values

---

## DLQ Operations

Use DLQ for schema/transform failures.

```sql
SELECT *
FROM `fynd-jio-commerceml-prod.temp_zenith_data.dbe_dlq`
WHERE dataset = 'shopify_backend'
ORDER BY created_at DESC
LIMIT 100
```

Recovery loop:
1. Inspect failed payload + error
2. Fix transformation/schema
3. Reprocess DLQ from pipeline manager

---

## Environments

| Stage | Dataset/Project |
|------|------------------|
| Non-prod | Stage-specific test dataset |
| Production | `fynd-jio-commerceml-prod.fynd_zenith_data` |

---

## Ownership Boundaries

- Source schema ownership: `shopify-backend`
- Transform/schema ownership: `transformations`
- Runtime orchestration ownership: Boltic pipeline operators
- Analytics consumption ownership: reporting/data consumers
