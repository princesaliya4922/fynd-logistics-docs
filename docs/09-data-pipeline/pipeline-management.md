---
title: Pipeline Management
sidebar_position: 3
---

# Pipeline Management

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How to manage and operate the MongoDB → BigQuery data pipelines.

---

## CLI Pipeline Manager

The `cli_pipeline_manager.js` tool in the `transformations/` repo provides an interactive CLI for managing pipelines.

### Setup

```bash
cd transformations/
npm install
```

### Supported Environments

| Environment | Alias |
|-------------|-------|
| Local development | `local` |
| Staging (fyndz0) | `z0` |
| Production | `prod` |

### Available Operations

```bash
node cli_pipeline_manager.js
```

Presents a menu:
1. **Create pipeline** — Register a new collection sync
2. **Update script** — Update transformation.js for an existing pipeline
3. **Update schema** — Update destination-schemas.json
4. **Test ingestion** — Run a test sync for a single batch
5. **Test batch processing** — Test batch with a small data sample
6. **Deploy pipeline** — Deploy changes to production
7. **Process DLQ** — Reprocess dead letter queue records
8. **Reset pipeline** — Reset sync cursor (force full reload)

---

## Checking Pipeline Status

### Via BigQuery (Direct Query)

```sql
-- Recent records synced for stores collection
SELECT store_id, shop, updated_on
FROM `fynd-jio-commerceml-prod.fynd_zenith_data.stores`
ORDER BY updated_on DESC
LIMIT 10
```

### Via DLQ Monitoring

```sql
-- Check for recent pipeline failures
SELECT *
FROM `fynd-jio-commerceml-prod.temp_zenith_data.dbe_dlq`
WHERE dataset = 'shopify_backend'
  AND created_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
ORDER BY created_at DESC
```

---

## Adding a New Collection

To sync a new MongoDB collection to BigQuery:

1. **Create the transformation directory:**
   ```bash
   mkdir -p transformations/shopify/mongo/shopify_backend/<collection_name>
   ```

2. **Write transformation.js:**
   ```javascript
   function runTransformation(row) {
     return {
       record_id: row._id?.toString(),
       shop: row.shop,
       // ... map all fields
       created_on: safeParseDate(row.createdAt),
       updated_on: safeParseDate(row.updatedAt)
     }
   }

   function transFormRow(row) {
     return { data: runTransformation(row) }
   }

   function transformRows(rows) {
     const transformed = rows.map(r => transFormRow(r))
     return JSON.stringify({
       data: transformed,
       __boltic_primary_key_columns: ['record_id'],
       __boltic_partition_columns: ['created_on']
     })
   }

   module.exports = { transformRows, transFormRow }
   ```

3. **Write destination-schemas.json** with BigQuery field types

4. **Register incremental column:**
   ```javascript
   // transformations/shopify/incremental-columns.js
   'mongo.shopify_backend.<collection>': 'updatedAt'
   ```

5. **Deploy via CLI:** Run `cli_pipeline_manager.js` → Create pipeline

---

## Reprocessing Failed Records

If records fail (appear in DLQ):

1. Investigate the failure reason in DLQ
2. Fix the transformation script if it's a transformation error
3. Update schema if it's a schema mismatch
4. Run `cli_pipeline_manager.js` → Process DLQ

---

## Field Type Reference

| MongoDB Type | BigQuery Type |
|-------------|--------------|
| String | `string` |
| Number | `number` |
| Boolean | `boolean` |
| Date/ISODate | `timestamp` |
| Object/Sub-document | `json` (serialized to JSON string) |
| Array | `json` (serialized to JSON string) or `array` |
| ObjectId | `string` (call `.toString()`) |
