---
title: Collections Synced
sidebar_position: 2
---

# Collections Synced to BigQuery

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

All MongoDB collections from `shopify_backend` that are synced to BigQuery.

---

## Synced Collections

### stores → `fynd_zenith_data.stores`

| MongoDB Field | BigQuery Column | Type | Description |
|--------------|----------------|------|-------------|
| `_id` | `store_id` | string | MongoDB ObjectId as string |
| `shop` | `shop` | string | Shopify store domain |
| `shopId` | `shop_id` | string | Shopify numeric shop ID |
| `name` | `name` | string | Store display name |
| `email` | `email` | string | Merchant email |
| `installedApps` | `installed_apps` | json | Array of installed app names |
| `fyndPromise` | `fynd_promise` | boolean | Whether Fynd Promise is active |
| `subscriptionId` | `subscription_id` | string | Shopify subscription ID |
| `subscriptionStatus` | `subscription_status` | string | `active`, `pending`, `expired` |
| `courierPartners` | `courier_partners` | json | Courier partner config |
| `embedActive` | `embed_active` | boolean | App embed active flag |
| `createdAt` | `created_on` | timestamp | Record creation |
| `updatedAt` | `updated_on` | timestamp | Last update |

**Primary key:** `store_id`
**Partition:** `created_on`

---

### orders → `fynd_zenith_data.orders`

| MongoDB Field | BigQuery Column | Type | Description |
|--------------|----------------|------|-------------|
| `_id` | `order_record_id` | string | MongoDB ObjectId |
| `shop` | `shop` | string | Store domain |
| `order_id` | `order_id` | string | Shopify order ID |
| `is_billed` | `is_billed` | boolean | Whether billed in cron |
| `tag` | `tag` | string | Optional order tag |
| `createdAt` | `created_on` | timestamp | Record creation |
| `updatedAt` | `updated_on` | timestamp | Last update |

**Primary key:** `order_record_id`
**Partition:** `created_on`

---

### subscriptions → `fynd_zenith_data.subscriptions`

| MongoDB Field | BigQuery Column | Type | Description |
|--------------|----------------|------|-------------|
| `_id` | `subscription_record_id` | string | MongoDB ObjectId |
| `shop` | `shop` | string | Store domain |
| `subscription_id` | `subscription_id` | string | Shopify subscription ID |
| `application_type` | `application_type` | string | `promise` or `logistics` |
| `plan` | `plan` | string | `Free` or `Growth` |
| `status` | `status` | string | Subscription status |
| `subscribed_on` | `subscribed_on` | timestamp | Subscription creation date |
| `approved_amount` | `approved_amount` | number | Max monthly charge cap |
| `consumed_amount` | `consumed_amount` | number | Amount charged this cycle |
| `billing_cycle_start` | `billing_cycle_start` | timestamp | Current cycle start |
| `billing_cycle_end` | `billing_cycle_end` | timestamp | Current cycle end |
| `comments` | `comments` | string | Admin notes |
| `createdAt` | `created_on` | timestamp | |
| `updatedAt` | `updated_on` | timestamp | |

**Primary key:** `subscription_record_id`
**Partition:** `created_on`

---

### productMappings → `fynd_zenith_data.product_mappings`

| MongoDB Field | BigQuery Column | Type | Description |
|--------------|----------------|------|-------------|
| `_id` | `product_mapping_id` | string | MongoDB ObjectId |
| `shop` | `shop` | string | Store domain |
| `product_name` | `product_name` | string | Product name |
| `sku` | `sku` | string | Product SKU |
| `product_id` | `product_id` | string | Shopify product ID |
| `variant_id` | `variant_id` | string | Shopify variant ID |
| `inventory_id` | `inventory_id` | string | Fynd inventory ID |
| `location_id` | `location_id` | string | Shopify location ID |
| `available` | `available` | number | Available quantity |
| `is_active` | `is_active` | boolean | Mapping active flag |
| `updatedAt` | `updated_on` | timestamp | |
| `createdAt` | `created_on` | timestamp | |

**Primary key:** `product_mapping_id`
**Partition:** `created_on`

---

### storeMappings → `fynd_zenith_data.store_mappings`

| MongoDB Field | BigQuery Column | Type | Description |
|--------------|----------------|------|-------------|
| `_id` | `store_mapping_id` | string | MongoDB ObjectId |
| `shop` | `shop` | string | Store domain |
| `location_id` | `location_id` | string | Shopify location ID |
| `label` | `label` | string | Location label |
| `processing_time` | `processing_time` | number | Processing time in days |
| `cut_off_time` | `cut_off_time` | string | Daily dispatch cut-off |
| `pincode` | `pincode` | string | Warehouse pincode |
| `address` | `address` | json | Full address object |
| `updatedAt` | `updated_on` | timestamp | |
| `createdAt` | `created_on` | timestamp | |

**Primary key:** `store_mapping_id`
**Partition:** `created_on`

---

### courierPartners → `fynd_zenith_data.courier_partners`

| MongoDB Field | BigQuery Column | Type | Description |
|--------------|----------------|------|-------------|
| `_id` | `courier_partner_id` | string | MongoDB ObjectId |
| `name` | `name` | string | Courier name |
| `scheme_id` | `scheme_id` | string | FLP scheme ID |
| `extension_id` | `extension_id` | string | Fynd extension ID |
| `is_default_cheapest` | `is_default_cheapest` | boolean | Default cheapest flag |
| `updatedAt` | `updated_on` | timestamp | |
| `createdAt` | `created_on` | timestamp | |

**Primary key:** `courier_partner_id`
**Partition:** `created_on`

---

## Collections NOT Synced

The following collections exist in MongoDB but do NOT currently have BigQuery transformations:

| Collection | Reason |
|-----------|--------|
| `shipments` | Not yet configured |
| `returns` | Not yet configured |
| `logistics` | Not yet configured |
| `logisticsOrders` | Not yet configured |
| `logisticsDeliveryPartners` | Not yet configured |
| `productAccounts` | Not yet configured |

Adding a new collection sync requires:
1. Create `transformation.js` in `transformations/shopify/mongo/shopify_backend/<collection>/`
2. Create `destination-schemas.json` with BigQuery schema
3. Add to `transformations/shopify/incremental-columns.js`
4. Deploy via `cli_pipeline_manager.js`
