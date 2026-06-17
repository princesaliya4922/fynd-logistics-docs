---
title: Database Schemas
sidebar_position: 2
---

# Database Schemas

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

All MongoDB collections used by `shopify-backend`. Database name: `shopify_backend`.

---

## stores

Primary store configuration. One document per Shopify store.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shop` | String | Yes | Shopify store domain (`my-store.myshopify.com`). **Unique index.** |
| `shopId` | String | Yes | Shopify shop numeric ID. **Unique index.** |
| `name` | String | No | Merchant store name |
| `ownerDetails` | Object | No | `{ firstName, lastName }` |
| `shopifyToken` | String | No | Shopify access token for logistics app. **Indexed.** |
| `promise_shopifyToken` | String | No | Shopify access token for promise app. **Indexed.** |
| `email` | String | **Yes** | Merchant email address |
| `installedApps` | Array[Object] | No | Per-app install records: `{ type, status, installedAt, uninstalledAt }`. `type` enum: `fynd-promise` / `fynd-logistics`; `status` enum: `active` / `inactive` / `uninstalled` (default `active`) |
| `bulkSync` | Boolean | No | Whether bulk product sync is in progress (default `false`) |
| `isActive` | Boolean | No | Whether the store is active (default `true`) |
| `deliveryPreference` | String | No | Promise app preference (default `""`) |
| `isRegistered` | Boolean | No | Whether the store has completed Promise setup (default `false`) |
| `promiseView` | String | No | How promise is displayed (default `""`) |
| `fyndPromise` | Boolean | No | Whether Fynd Promise is enabled (default `false`) |
| `subscriptionId` | String | No | Shopify subscription ID |
| `subscriptionStatus` | String | No | Subscription status string |
| `courierPartners` | Object | No | `{ cheapest: [String], onTime: [String], express: [String] }` (arrays of courier schema IDs) |
| `domains` | Array[String] | No | Custom domains for this store (CORS whitelist, default `[]`) |
| `embedActive` | Object | No | `{ status: Boolean (default false), expiresAt: Date }` — app theme-embed status with TTL |
| `logisticsStatus` | String | No | Logistics app install status. Enum: `installed` / `uninstalled` / `null` (default `null`) |
| `promiseStatus` | String | No | Promise app install status. Enum: `installed` / `uninstalled` / `null` (default `null`) |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp (used for BigQuery sync) |

**Indices** (note: `autoIndex` is disabled; indices created out-of-band):
- `{ shop: 1 }` — unique
- `{ shopId: 1 }` — unique
- `{ shopifyToken: 1 }`
- `{ promise_shopifyToken: 1 }`

---

## logistics

Logistics setup configuration per store.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain. **Unique index.** |
| `shopEmail` | String | Merchant email (default `""`) |
| `companyEmail` | String | Fynd company email (default `""`) |
| `companyEmailVerified` | Boolean | Whether `companyEmail` is verified (default `false`) |
| `companyEmailVerifiedAt` | Date | When email was verified (default `null`) |
| `companyEmailVerificationSource` | String | Which flow set `companyEmail`. Enum: `link-existing` / `create-new-direct` / `null` |
| `companyDetails` | Object | `{ companyId: String, label: String }` |
| `salesChannelDetails` | Object | `{ salesChannelId: String, label: String }` |
| `processingTime` | Object | `{ mode: enum("fyndManaged"/"common"), value: String }` (value required when `mode === "common"`) |
| `shippingPreference` | Object | `{ mode: enum("fyndManaged"/"preference"), value: [String] }` where `value` enum: `fynd-recommended` / `fastest` / `cheapest` / `tms` (at least one required when `mode === "preference"`) |
| `promiseView` | String | Enum: `min` / `max` / `range` (default `""`) |
| `locationProcessingTimes` | Array[Object] | `{ locationId, processingTime, unit }` per location (default `[]`) |
| `qcConfig` | Object | `{ skip: Boolean, checks: [{ question, question_id }] }` (default `{ skip: false, checks: [] }`) |
| `timestamp` | String | Free-form timestamp (default `""`) |
| `enabled` | Boolean | Whether logistics operations are enabled (default from `logistics.default_enabled`). **Indexed.** |
| `logisticsEngine` | String | Enum: `flp` / `oms` (default `flp`; getter returns `oms` when unset) |
| `flpChannel` | Object | `{ clientId, clientSecret, accessToken, accessTokenExpiresAt }` |
| `plan` | Object | `{ name: enum("FREE"/"PAID") (default PAID), fulfillmentLimit: Number (default 5), fulfillmentsUsed: Number (default 0), autoDisabledAt: Date, autoDisabledReason: enum("LIMIT_EXHAUSTED"/"MANUAL"/null) }` |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indices:**
- `{ shop: 1 }` — unique
- `{ enabled: 1 }`
- `{ "companyDetails.companyId": 1, logisticsEngine: 1 }` — FLP webhook hot path

> There are no `deliveryPromise`, `pickupLocations`, or `isSetupComplete` fields.

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
| `fynd_shipment_id` | String | FLP shipment ID. **Indexed.** |
| `carrier_assignment_failed` | Boolean | Whether carrier assignment failed (default `false`) |
| `pdf_media` | Object | Shipping label / invoice URLs |
| `fulfillment_engine` | String | Enum: `oms` / `flp` (default `undefined`) |
| `seller_location_snapshot` | Object | Warehouse snapshot at fulfillment time |
| `pricing_snapshot` | Object | Pricing snapshot at fulfillment time |
| `cancellation_source` | String | Enum from `CANCELLATION_SOURCES` (default `undefined`) |
| `cancelled_at` | Date | When cancelled (default `null`) |
| `cancellation_pending` | Boolean | Whether a cancellation is in flight (default `undefined`) |
| `cancellation_meta` | Object | Cancellation metadata (default `undefined`) |
| `last_fulfillment_event` | Object | `{ status, emitted_at, fulfillment_id }` — last Shopify fulfillment event emitted (default `null`) |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indices:**
- `{ shop: 1, status: 1 }`
- `{ shop: 1, order_id: 1 }`
- `{ fulfillment_order_id: 1 }` — unique
- `{ fynd_order_id: 1 }`, `{ fulfillment_id: 1 }`, `{ fynd_shipment_id: 1 }`

---

## orders

Lightweight order reference records, primarily for billing.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain. **Indexed.** |
| `orderId` | String | Shopify order ID. **Unique, indexed.** |
| `isBilled` | Boolean | Whether this order has been billed (default `false`) |
| `tag` | String | Optional tag for categorization |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto (used for BigQuery sync) |

> Field names are camelCase: `orderId` and `isBilled` (not `order_id` / `is_billed`).

---

## returns

Return records (one per return request; partial returns allowed).

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `order_id` | String | Shopify order ID |
| `fulfillment_id` | String | Shopify fulfillment being returned. **Indexed** (not unique — partial returns) |
| `shipment_id` | ObjectId | Ref to `shipments`. **Indexed.** Primary (lowest-numeric) involved shipment |
| `fynd_shipment_id` | String | Original (forward) Fynd shipment ID. **Indexed.** |
| `shipment_ids` | Array[ObjectId] | All involved `shipments` refs (customer-requested approvals spanning multiple fulfillments; default `[]`) |
| `fynd_shipment_ids` | Array[String] | All involved Fynd shipment IDs (default `[]`) |
| `fulfillment_ids` | Array[String] | All involved Shopify fulfillment IDs (default `[]`) |
| `fynd_return_shipment_id` | String | NEW return shipment ID created by Fynd. **Indexed.** |
| `fynd_order_id` | String | Fynd order ID (default `null`) |
| `fulfillment_engine` | String | Enum: `oms` / `flp` |
| `shopify_return_id` | String | Shopify return ID. **Indexed.** |
| `shopify_return_gid` | String | Shopify return GID |
| `shopify_request_return_gid` | String | Set only for customer-requested approvals (same Shopify return, kept distinct for analytics) |
| `source` | String | Enum: `merchant_initiated` / `customer_requested_approved` (default `merchant_initiated`) |
| `status` | String | Enum: `initiated` / `processing` / `completed` / `failed` / `cancelled` (default `initiated`) |
| `error_details` | Object | Error info (default `null`) |
| `retry_count` | Number | Retry attempts (default `0`) |
| `dp_details` | Object | Delivery partner info (default `null`) |
| `carrier_assignment_failed` | Boolean | Whether carrier assignment failed (default `false`) |
| `pdf_media` | Object | Label / invoice URLs (default `null`) |
| `cancellation_source` | String | Enum from `CANCELLATION_SOURCES` (default `undefined`) |
| `cancelled_at` | Date | When cancelled (default `null`) |
| `cancellation_pending` | Boolean | Cancellation in flight (default `undefined`) |
| `cancellation_meta` | Object | Cancellation metadata (default `undefined`) |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indices:**
- `{ shop: 1, order_id: 1 }`, `{ shop: 1, status: 1 }`, `{ shop: 1, fulfillment_id: 1 }`
- `{ fynd_order_id: 1, shop: 1 }`, `{ shipment_id: 1 }`

> There are no `fynd_return_id`, `reason`, or `items` fields.

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
| `shop` | String | Store domain. **Indexed.** |
| `subscriptionId` | String | Shopify subscription ID. **Unique.** |
| `applicationType` | String | Enum: `fynd_promise` / `fynd_logistics`. **Required.** |
| `plan` | String | Plan name. **Required.** |
| `status` | String | Enum: `active` / `cancelled` / `expired` / `uninstalled` (default `active`) |
| `subscribedAt` | Date | When subscription was created (default now, required) |
| `approvedAmount` | String | Maximum approved billing amount |
| `consumedAmount` | String | Amount billed so far this cycle (default `'0'`) |
| `billingCycleStart` | Date | Start of current billing period (default now) |
| `billingCycleEnd` | Date | End of current billing period |
| `test` | Boolean | Whether this is a Shopify test subscription (default `false`) |
| `comments` | String | Notes |
| `createdAt` / `updatedAt` | Date | Auto |

> Field names are camelCase. Status enum has no `pending` value.

---

## transactions

Billing transaction records.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain. **Indexed.** Required. |
| `subscriptionId` | String | Related subscription ID. **Unique, required.** |
| `applicationType` | String | Enum: `fynd_promise` / `fynd_logistics`. **Required.** |
| `billingId` | String | Billing identifier. **Required.** |
| `billingStart` | Date | Billing period start. **Required.** |
| `billingEnd` | Date | Billing period end. **Required.** |
| `orderCount` | Number | Number of orders billed (default `0`) |
| `totalAmount` | Number | Total transaction amount. **Required.** |
| `paymentStatus` | String | Enum: `pending` / `paid` / `failed` / `refunded` (default `pending`) |
| `paymentMethod` | String | Payment method |
| `transactionReference` | String | External transaction reference |
| `currency` | String | Currency (default `INR`) |
| `status` | String | Enum: `active` / `cancelled` / `expired` (default `active`) |
| `comments` | String | Notes |
| `createdAt` / `updatedAt` | Date | Auto |

> **Known issue:** `subscriptionId` is marked **unique**, which prevents more than one transaction per subscription — likely a bug for a per-cycle billing record. Also note the billing controller (`controllers/billing.js`) writes fields not present on this schema (`plan`, `consumedAmount`, `approvedAmount`) and omits the required `applicationType`, `billingId`, and `totalAmount`, so its insert would fail validation (see Billing Reference).

---

## items

Per-line-item quantity tracking across the fulfillment/return lifecycle.

| Field | Type | Description |
|-------|------|-------------|
| `shop` | String | Store domain |
| `order_id` | String | Shopify order ID |
| `line_item_id` | String | Shopify line item ID |
| `inventory_item_id` / `product_id` / `variant_id` | String | Shopify identifiers |
| `total_ordered_qty` | Number | Total ordered quantity |
| `qty_sent_to_fynd` | Number | Quantity sent to Fynd |
| `qty_fulfilled_by_shopify` | Number | Quantity fulfilled by Shopify |
| `qty_delivered` | Number | Quantity delivered |
| `qty_cancelled_on_fynd` | Number | Quantity cancelled on Fynd |
| `qty_returned` | Number | Quantity returned |
| `qty_return_cancelled` | Number | Return quantity cancelled |
| `createdAt` / `updatedAt` | Date | Auto |

---

## shipmentItems

Line items belonging to a shipment.

| Field | Type | Description |
|-------|------|-------------|
| `shipment_id` | (ref) | Parent shipment |
| `item_id` | (ref) | Parent `items` record |
| `quantity` | Number | Quantity in this shipment |
| `shop` | String | Store domain |
| `line_item_id` / `fulfillment_order_line_item_id` / `fulfillment_line_item_id` | String | Shopify identifiers |
| `cancelled` | Boolean | Whether cancelled |
| `cancelled_at` | Date | When cancelled |
| `createdAt` / `updatedAt` | Date | Auto |

---

## returnItems

Line items belonging to a return.

| Field | Type | Description |
|-------|------|-------------|
| `return_id` | (ref) | Parent return |
| `shipment_item_id` / `item_id` | (ref) | Source shipment item / item record |
| `shop` | String | Store domain |
| `line_item_id` / `fulfillment_order_line_item_id` | String | Shopify identifiers |
| `quantity` | Number | Quantity being returned |
| `return_reason` / `return_reason_note` | String | Return reason and note |
| `seller_identifier` / `line_number` / `identifier` | Mixed | Fynd identifiers |
| `status` | String | Return item status |
| `error_details` | Object | Error info |
| `createdAt` / `updatedAt` | Date | Auto |

---

## countries

Country/state reference data for serviceability.

| Field | Type | Description |
|-------|------|-------------|
| `iso_code` | String | ISO country code |
| `display_name` / `name` | String | Country names |
| `phone_code` | String | Dialing code |
| `timezones` | Array | Timezones |
| `serviceability_fields` | Object | Address/serviceability field definitions |
| `createdAt` / `updatedAt` | Date | Auto |

---

## Database Connections

The backend defines **separate read/write and read-only MongoDB connections**:

```javascript
// Write operations
Fit.connections.mongo.shopify_backend.write

// Read operations
Fit.connections.mongo.shopify_backend.read
```

Configured via:
- `MONGO_SHOPIFY_BACKEND_READ_WRITE` — primary (read/write) node
- `MONGO_SHOPIFY_BACKEND_READ_ONLY` — replica (read-only) node

> **Caveat — the read/write split is only partially wired.** Only the `stores` and `logistics` models register their schema on **both** the read and write connections (and use the read connection for some queries). All other models (`subscriptions`, `orders`, `transactions`, `shipments`, `returns`, `items`, `shipmentItems`, `returnItems`, `countries`, etc.) export only the **write** connection model, so their reads also go to the primary node.
