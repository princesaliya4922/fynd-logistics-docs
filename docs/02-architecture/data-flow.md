---
title: Data Flow
sidebar_position: 7
---

# End-to-End Data Flow

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

This document traces data through the system for the key lifecycle events.

---

## Flow 1: App Installation

```
Merchant clicks "Install" on Shopify App Store
    │
    ▼
Shopify redirects to:
  https://pincode-checker.extensions.fynd.com/api/auth?shop=store.myshopify.com
    │
    ▼
@shopify/shopify-app-express initiates OAuth:
  Redirects merchant to Shopify consent page
    │
    ▼
Merchant approves → Shopify redirects to:
  /api/auth/callback?code=xxx&shop=store.myshopify.com
    │
    ▼
Access token exchanged → stored in SQLite (Promise) / Redis (Logistics)
    │
    ▼
fyndIntegration.js middleware fires:
  1. GET /admin/api/*/shop.json → get shop details (country, email, name)
  2. If country_code !== 'IN' → abort (India-only)
  3. POST shopify-backend/config/register
     { shop, email, shopId, name, token, appName }
  4. Create Shopify webhooks pointing to shopify-backend
    │
    ▼
MongoDB: stores collection upserted
  { shop: "store.myshopify.com", isActive: true, installedApps: ["promise"] }
    │
    ▼
Merchant lands on app dashboard
```

---

## Flow 2: Merchant Configures Promise App

```
Merchant opens Fynd Promise app
    │
    ▼
RegionHandle:
  GET /api/shop → shopify-backend → Shopify REST API
  Check country_code === 'IN'
    │
    ▼
UserHandle:
  POST /api/subscription → shopify-backend → MongoDB subscriptions collection
  Returns: { active: true/false, plan: "Free"/"Growth" }
    │
    ▼ (if subscribed)
NewSetting:
  GET /api/locations → shopify-backend
    1. Check MongoDB storeMappings for existing config
    2. If not found: GET /admin/api/*/locations.json (Shopify API)
  Returns: { data: { result, deliveryPreference, promiseView }, boarding: boolean }
    │
    ▼ (if not onboarded)
DeliveryWidget:
  Merchant configures:
  - Delivery preferences (promiseView: range/fixed)
  - Pincode range
  POST /api/updateConfig → shopify-backend
    MongoDB: stores collection updated (deliveryPreference, promiseView)
    │
    ▼
StepProgress:
  Merchant sees configured state
  Can update via /api/updateConfig
```

---

## Flow 3: Customer Checks Pincode (PDP)

```
Customer visits product page
    │
    ▼
pincodeService.js (Theme Extension) injects widget
  Widget renders: "Check delivery for your pincode"
    │
    ▼
Customer types 6-digit pincode → clicks "Check"
  Client validation: /^[1-9][0-9]{5}$/.test(pincode)
    │
    ▼ (if valid)
POST https://shopify-backend.extensions.fynd.com/location/service
  headers: { 'x-api-key': merchant's base_api_key }
  body: { shop: "store.myshopify.com", pincode: "400001", products: [...] }
    │
    ▼
shopify-backend/serviceability.controller.js:
  1. Look up MongoDB stores → get deliveryPreference, promiseView
  2. Look up MongoDB storeMappings → get warehouse location + processing time
  3. Call Fynd Serviceability API:
     { pincode, warehouseId, cutoffTime, processingTime }
    │
    ▼
Fynd returns:
  { serviceable: true, deliveryDate: "Mon 25 Mar - Wed 27 Mar" }
    │
    ▼
Widget shows: "Delivery by Mon 25 Mar - Wed 27 Mar" ✓
  Stored in sessionStorage for page navigation persistence
  "Buy Now" / "Add to Cart" buttons re-enabled
```

---

## Flow 4: Order Creation → Fulfillment

```
Customer places order on Shopify store
    │
    ▼
Shopify fires webhook:
  POST shopify-backend/webhook/store/{shop}/orders/create?app=logistics
  Headers: X-Shopify-Hmac-Sha256: <signature>
    │
    ▼
shopifyHmacAuth middleware:
  Verify HMAC signature → 401 if invalid
    │
    ▼
webhook.controller.js routes to:
  shopifyWebhookService.handleOrderCreate(shop, payload)
    │
    ▼
shopifyWebhookService:
  1. Check if logistics is enabled for shop (MongoDB stores.logistics_status)
  2. If disabled: log and return
  3. Check fulfillment limit (free plan ≤ 50/month)
  4. Get fulfillment orders from Shopify:
     GET /admin/api/*/orders/{id}/fulfillment_orders.json
    │
    ▼
fulfilmentService.processOrder(shop, order, fulfillmentOrders):
  1. For each fulfillment order:
     a. Determine fulfillment engine (flp or oms)
     b. Create MongoDB shipment record:
        { shop, order_id, fulfillment_order_id, status: "queued" }
     c. Call FLP API to create shipment:
        POST /external/api/v1/company/{id}/application/{appId}/shipment
     d. Update MongoDB: { status: "processing", fynd_shipment_id: "..." }
    │
    ▼ (async, via FLP webhook)
FLP fires status update:
  POST shopify-backend/webhook/flp
  { shipmentId, status: "delivered", awb: "1234567890" }
    │
    ▼
webhook.controller.js → shipmentService.handleFLPUpdate():
  1. Update MongoDB shipment: { status: "fulfilled", fynd_status: "delivered" }
  2. Update Shopify fulfillment via Admin API:
     PUT /admin/api/*/fulfillments/{id}/update_tracking.json
  3. Merchant sees order fulfilled in Shopify Admin
```

---

## Flow 5: Billing Cycle

```
[Cron: runs on 7th, 14th, 21st, 28th of each month]
    │
    ▼
cron/index.js (MODE=cron, CRON_JOB=billing_trigger):
  GET all active subscriptions from MongoDB (subscriptions collection)
    │
    ▼
For each subscription due for billing:
  1. Count orders in billing period:
     MongoDB orders WHERE shop=X AND createdAt BETWEEN billingStart AND billingEnd
  2. If orders > free_tier (50):
     POST Shopify Billing API: createUsageRecord
     { subscriptionLineItemId, price: orders * 1.0, description: "Order billing" }
  3. Update MongoDB subscription:
     { billingCycleStart: next_period, billingCycleEnd: next_period + 7 days }
    │
    ▼
Billing complete → process exits
```

---

## Flow 6: MongoDB → BigQuery (Data Pipeline)

```
MongoDB shopify_backend database
  Collections: stores, orders, subscriptions,
               productMappings, storeMappings, courierPartners
    │
    ▼
Zenith incremental sync (scheduled):
  For each collection:
  1. Read records WHERE updatedAt > lastSyncTime
  2. Apply transformation.js:
     - Map _id to human-readable primary key
     - Flatten nested objects
     - Normalize timestamps to BigQuery format
     - Safe-parse JSON fields
  3. Load to BigQuery:
     destination: fynd-jio-commerceml-prod.fynd_zenith_data.<table_name>
  4. Update lastSyncTime
    │
    ▼
BigQuery available for analytics queries
  - Store installs, configurations
  - Order volumes per shop
  - Subscription states and billing history
  - Product catalog mappings
  - Location/warehouse configurations
```
