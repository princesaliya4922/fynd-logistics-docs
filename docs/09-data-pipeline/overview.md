---
title: Data Pipeline Overview
sidebar_position: 1
---

# Data Pipeline Overview

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How `shopify-backend`'s MongoDB data is synced to Google Cloud BigQuery for analytics.

---

## Architecture

```
MongoDB (shopify_backend database)
         ↓
    Zenith Pipeline
    (transformation scripts)
         ↓
Google Cloud BigQuery
dataset: fynd_zenith_data
project: fynd-jio-commerceml-prod
```

---

## Pipeline Technology Stack

| Component | Technology |
|-----------|-----------|
| Source | MongoDB (Zenith read replica) |
| Transformation | JavaScript scripts (Node.js) |
| Orchestrator | **Boltic** (Fynd's internal pipeline orchestrator) |
| Destination | Google Cloud BigQuery |
| Management CLI | `cli_pipeline_manager.js` |
| Error tracking | BigQuery DLQ (Dead Letter Queue) |

---

## Sync Strategy

**Type:** Incremental sync (not full reload, not CDC/Change Data Capture)

All `shopify_backend` collections use the `updatedAt` field as the incremental column:

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

On each sync run:
1. Read MongoDB records where `updatedAt > lastSyncTime`
2. Apply transformation
3. Upsert to BigQuery (using `__boltic_primary_key_columns`)
4. Update `lastSyncTime`

---

## Transformation Pipeline

Each collection has two files:

```
transformations/shopify/mongo/shopify_backend/<collection>/
├── transformation.js        # JavaScript transformation function
└── destination-schemas.json # BigQuery table schema definition
```

### transformation.js Structure

```javascript
function runTransformation(row) {
  // Map MongoDB fields to BigQuery columns
  return {
    store_id: row._id?.toString(),
    shop: row.shop,
    // ... more field mappings
  }
}

function transFormRow(row) {
  return { data: runTransformation(row) }
}

function transformRows(rows) {
  const transformed = rows.map(row => transFormRow(row))
  return JSON.stringify({
    data: transformed,
    __boltic_primary_key_columns: ['store_id'],
    __boltic_partition_columns: ['created_on']
  })
}

module.exports = { transformRows, transFormRow }
```

### destination-schemas.json Structure

Defines the BigQuery table schema:

```json
{
  "fields": [
    { "name": "store_id", "type": "string", "isNullable": false, "description": "MongoDB ObjectId as string" },
    { "name": "shop", "type": "string", "isNullable": false, "description": "Shopify store domain" },
    { "name": "created_on", "type": "timestamp", "isNullable": true }
  ]
}
```

---

## Data Quality

### Safe Date Parsing

Dates are validated to be within BigQuery's supported range:
- Minimum: 1970-01-01
- Maximum: 2262-04-11

Invalid dates are replaced with `null`.

### Safe JSON Parsing

Nested MongoDB objects (like `address`, `courierPartners` array) are serialized to JSON strings using safe parsing that handles malformed data gracefully.

---

## Environments

| Environment | BigQuery Dataset | Notes |
|-------------|----------------|-------|
| Staging | Separate test dataset | `z0` environment uses different dataset |
| Production | `fynd-jio-commerceml-prod.fynd_zenith_data` | Main analytics dataset |

---

## Pipeline Management

The `cli_pipeline_manager.js` tool manages pipeline operations interactively. See [Pipeline Management](./pipeline-management.md) for usage.
