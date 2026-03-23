---
title: Database Schemas
sidebar_position: 2
---

# Database Schemas

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

All MongoDB collections used by `shopify-backend`. Database name: `shopify_backend`.

---

## stores

Primary store configuration. One document per Shopify store.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shop` | String | Yes | Shopify store domain (`my-store.myshopify.com`). **Unique index.** |
| `shopId` | String | Yes | Shopify shop numeric ID. **Unique index.** |
| `name` | String | No | Merchant store name |
| `shopifyToken` | String | No | Shopify access token for logistics app. **Indexed.** |
| `promise_shopifyToken` | String | No | Shopify access token for promise app |
| `email` | String | No | Merchant email address |
| `installedApps` | Array[String] | No | Which apps installed: `["promise", "logistics"]` |
| `bulkSync` | Boolean | No | Whether bulk product sync is in progress |
| `isActive` | Boolean | No | Whether the store is active |
| `deliveryPreference` | String | No | Promise app preference (e.g., `"standard"`) |
| `isRegistered` | Boolean | No | Whether the store has completed Promise setup |
| `promiseView` | String | No | How promise is displayed (`"range"`, `"fixed"`) |
| `fyndPromise` | Mixed | No | Promise-specific config object |
| `subscriptionId` | String | No | Shopify subscription ID |
| `subscriptionStatus` | String | No | `"active"`, `"pending"`, `"expired"`, etc. |
| `courierPartners` | Array | No | Promise courier partner configs |
| `domains` | Array[String] | No | Custom domains for this store |
| `embedActive` | Boolean | No | Whether app embed is active |
| `logistics_status` | String | No | Logistics enable state (`"enabled"`, `"disabled"`) |
| `promise_status` | String | No | Promise enable state |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp (used for BigQuery sync) |

**Indices:**
- `{ shop: 1 }` — unique
- `{ shopId: 1 }` — unique
- `{ shopifyToken: 1 }`

---

## logistics

Logistics setup configuration per store.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain. **Unique index.** |
| `shopEmail` | String | Merchant email |
| `companyEmail` | String | Fynd company email |
| `companyDetails` | Object | `{ companyId, label, uid }` |
| `salesChannelDetails` | Object | `{ applicationId, name, domain }` |
| `processingTime` | Object | `{ mode: "fyndManaged"/"common", value: 1 }` |
| `shippingPreference` | String | `"cheapest"`, `"fastest"`, `"manual"` |
| `deliveryPromise` | Object | `{ type: "range"/"fixed", min: 2, max: 4 }` |
| `pickupLocations` | Array | Mapped warehouse locations |
| `isSetupComplete` | Boolean | Whether setup flow is done |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

---

## shipments

Individual shipment records, one per Shopify fulfillment order.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `order_id` | String | Shopify order ID |
| `fulfillment_order_id` | String | Shopify fulfillment order ID. **Unique index.** |
| `fynd_order_id` | String | Fynd platform order ID |
| `fulfillment_id` | String | Shopify fulfillment ID |
| `refulfilled_shopify` | Boolean | Whether this was re-fulfilled |
| `status` | String | `"queued"`, `"processing"`, `"fulfilled"`, `"error"`, `"cancelled"` |
| `fynd_status` | String | Fynd-side status (e.g., `"delivered"`, `"in_transit"`) |
| `error_details` | Object | Error info if `status === "error"` |
| `retry_count` | Number | Number of retry attempts |
| `dp_details` | Object | Delivery partner info `{ name, awb_no, trackingUrl }` |
| `fynd_shipment_id` | String | FLP shipment ID |
| `pdf_media` | Object | Shipping label / invoice URLs |
| `fulfillment_engine` | String | `"flp"` or `"oms"` |
| `seller_location_snapshot` | Object | Warehouse snapshot at fulfillment time |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indices:**
- `{ shop: 1, status: 1 }`
- `{ shop: 1, order_id: 1 }`
- `{ fulfillment_order_id: 1 }` — unique

---

## orders

Lightweight order reference records, primarily for billing.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `order_id` | String | Shopify order ID. Unique per shop. |
| `is_billed` | Boolean | Whether this order has been billed |
| `tag` | String | Optional tag for categorization |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto (used for BigQuery sync) |

---

## returns

Return order records.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `shopify_order_id` | String | Original Shopify order ID |
| `fulfillment_order_id` | String | Fulfillment order being returned |
| `fynd_return_id` | String | Fynd return order ID |
| `status` | String | `"initiated"`, `"picked_up"`, `"received"`, `"cancelled"` |
| `reason` | String | Return reason |
| `items` | Array | Line items being returned |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

---

## logisticsOrders

Maps Fynd order IDs to Shopify order IDs.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `shopify_order_id` | String | Shopify order ID |
| `fynd_order_id` | String | Fynd order ID |
| `createdAt` | Date | Auto |

---

## logisticsDeliveryPartners

Delivery partner integrations per store.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `company_id` | Number | Fynd company ID |
| `application_id` | String | Fynd application ID |
| `partner_name` | String | Delivery partner name (e.g., "Delhivery") |
| `scheme_id` | String | Service scheme ID |
| `account_id` | String | Partner account ID on Fynd platform |
| `is_active` | Boolean | Whether this partner is active |

---

## courierPartners

Platform-level courier partner definitions (not per-store).

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Courier partner name |
| `scheme_id` | String | FLP scheme ID |
| `extension_id` | String | Fynd extension ID |
| `is_default_cheapest` | Boolean | Whether this is the default cheapest option |
| `logo_url` | String | Partner logo URL |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto (BigQuery sync) |

---

## productAccounts

Fynd product accounts linked to stores (for billing).

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `owner_email` | String | Account owner email |
| `account_id` | String | Fynd product account ID |
| `organization_id` | String | Fynd organization ID |
| `plan` | String | Current plan name |
| `status` | String | Account status |

---

## productMappings

Shopify product/variant → Fynd inventory mappings.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `product_name` | String | Product name |
| `sku` | String | SKU identifier |
| `product_id` | String | Shopify product ID |
| `variant_id` | String | Shopify variant ID |
| `inventory_id` | String | Fynd inventory item ID |
| `location_id` | String | Shopify location ID |
| `available` | Number | Available quantity |
| `is_active` | Boolean | Whether mapping is active |
| `updatedAt` | Date | Auto (BigQuery sync) |

---

## storeMappings

Shopify location → Fynd warehouse mappings.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `location_id` | String | Shopify location ID |
| `label` | String | Location/warehouse label |
| `processing_time` | Number | Processing time in days |
| `cut_off_time` | String | Daily cut-off time (e.g., `"15:00"`) |
| `pincode` | String | Warehouse pincode |
| `address` | Object | Full address `{ line1, line2, city, state, country, pincode }` |
| `fynd_location_id` | String | Corresponding Fynd location ID |
| `updatedAt` | Date | Auto (BigQuery sync) |

---

## subscriptions

Billing subscription records per store per app.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `subscription_id` | String | Shopify subscription ID |
| `application_type` | String | `"promise"` or `"logistics"` |
| `plan` | String | `"Free"` or `"Growth"` |
| `status` | String | `"active"`, `"pending"`, `"expired"`, `"cancelled"` |
| `subscribed_on` | Date | When subscription was created |
| `approved_amount` | Number | Maximum approved billing amount |
| `consumed_amount` | Number | Amount billed so far this cycle |
| `billing_cycle_start` | Date | Start of current billing period |
| `billing_cycle_end` | Date | End of current billing period |
| `comments` | String | Notes |
| `updatedAt` | Date | Auto (BigQuery sync) |

---

## transactions

Billing transaction records.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `subscription_id` | String | Related subscription ID |
| `amount` | Number | Transaction amount (INR) |
| `orders_count` | Number | Number of orders billed |
| `billing_period_start` | Date | Billing period start |
| `billing_period_end` | Date | Billing period end |
| `shopify_usage_record_id` | String | Shopify usage record ID |
| `createdAt` | Date | Auto |

---

## Database Connections

The backend uses **separate read/write and read-only MongoDB connections** for all models:

```javascript
// Write operations
Fit.connections.mongo.shopify_backend.write

// Read operations
Fit.connections.mongo.shopify_backend.read
```

This allows read traffic to be routed to a replica node, reducing load on the primary. Configured via:
- `MONGO_SHOPIFY_BACKEND_READ_WRITE` — primary node
- `MONGO_SHOPIFY_BACKEND_READ_ONLY` — replica node
