---
title: External Integrations
sidebar_position: 6
---

# External Integrations

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

`shopify-backend` integrates with multiple external services. This document details each integration.

---

## 1. Fynd Central API

**Purpose:** Company/user management, sales channel operations, subscription management.

**Base URL:** `config.get('logistics_api_base_url')` (environment-specific)

**Auth:** API key headers (`x-api-key`, `x-api-secret`) or Admin Bearer token

### Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/service/integration/auth/v1.0/users` | Create or get a user by email (for OTP flow) |
| POST | `/service/integration/payment/v1/organization` | Create a new organization/company |
| POST | `/service/integration/payment/v1/productAccounts` | Create a product account for billing |
| GET | `/service/integration/payment/v1/productAccounts?ownerEmail={email}` | List product accounts by email |
| POST | `/service/panel/authentication/v1.0/admin/oauth/token` | Obtain admin Bearer token (client credentials) |
| POST | `/service/___/administrator/authorization/v1.0/extension/install` | Auto-install the Fynd extension for a company |
| GET | `/service/___/administrator/billing/v1.0/company/{id}/subscription/current` | Get current subscription for a company |
| POST | `/service/___/administrator/billing/v1.0/company/{id}/company-subscription/plan-change` | Change subscription plan |

### When Used

- **Account linking** (`linkExistingService.js`): OTP send/verify, company list fetch
- **Account creation** (`logisticsService.js`): company registration, product account creation
- **Subscription management** (`billing cron`): check and update billing plans

---

## 2. FLP Platform API

**Purpose:** Create shipments, cancel shipments, manage FLP channels.

**Base URL:** `config.get('flp_platform_api_base_url')`

**Auth:** Bearer token (obtained from Fynd Central) + company-specific tokens

### Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/external/api/v1/company/{companyId}/channels` | Create an FLP channel for a company+application |
| POST | `/external/api/v1/company/{companyId}/token` | Generate an FLP token |
| POST | `/external/api/v1/company/{companyId}/webhook` | Register a webhook with FLP |
| POST | `/external/api/v1/company/{companyId}/application/{appId}/shipment` | Create a shipment |
| POST | `/external/api/v1/company/{companyId}/application/{appId}/shipment/{shipId}/cancel` | Cancel a shipment |

### Shipment Creation Payload (simplified)

```json
{
  "shopifyOrderId": "12345",
  "fulfillmentOrderId": "67890",
  "lineItems": [...],
  "shippingAddress": { "pincode": "400001", ... },
  "warehouseId": "fynd-location-id"
}
```

### FLP Webhook (Inbound)

FLP sends shipment status updates to:
```
POST shopify-backend/webhook/flp
```

Events handled:
- Shipment picked up
- Shipment in transit
- Shipment delivered
- Shipment cancelled
- Shipment returned

---

## 3. Fynd Logistics Extension API

**Purpose:** Configure delivery partners for a company's sales channel.

**Base URL:** `config.get('logistics_extension_api_base_url')`

**Auth:** `LOGISTICS_EXTENSION_AUTH_TOKEN`

### Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1.0/external/{extensionId}/service-plan-list` | Get available delivery partner service plans |
| PUT | `/v1.0/external/company/{companyId}/application/{appId}/account/{accountId}` | Enable/update a delivery partner account |
| POST | `/v1.0/external/company/1/application/{appId}/account` | Install a delivery partner (legacy) |

---

## 4. Fynd Serviceability API

**Purpose:** Check if a pincode is serviceable by a merchant's warehouse.

**Base URL:** Part of the Fynd extension base URL.

### How It Works

```
POST /location/service (shopify-backend)
  body: { shop, pincode, products }
          ↓
shopify-backend:
  1. Looks up merchant config (stores + storeMappings)
  2. Calls Fynd Serviceability API:
     POST /external/.../serviceability/check
     with: { pincode, warehouseId, productIds }
          ↓
Returns: {
  serviceable: boolean,
  promiseDate: "Mon–Wed",
  deliveryPartner: "BlueDart"
}
```

---

## 5. Shopify Admin API

**Purpose:** Read/write Shopify store data on behalf of merchants.

**Auth:** Shopify access token (stored in session) attached to every API call.

**Library:** `@shopify/shopify-api` (REST and GraphQL clients)

### Operations Performed

| Operation | API | When |
|-----------|-----|------|
| Get shop details | REST `GET /admin/api/*/shop.json` | App install + settings |
| Get locations | REST `GET /admin/api/*/locations.json` | Setup flow |
| Get published theme | REST `GET /admin/api/*/themes.json` | Theme setup |
| Get orders | REST/GraphQL | Fulfillment |
| Get fulfillment orders | GraphQL | Fulfillment routing |
| Create fulfillment | GraphQL | Fulfillment |
| Update fulfillment status | REST | After FLP webhook |
| Create billing subscription | GraphQL | App install |
| Create usage record | GraphQL | Billing cron |
| Get app subscription | GraphQL | Billing check |
| Create webhooks | REST | App install |
| Create returns | GraphQL | Returns flow |

---

## 6. Fynd Platform SDK (FDK)

**Purpose:** Higher-level wrapper around Fynd APIs.

**Packages:**
- `@gofynd/fdk-client-javascript` — Platform API client
- `fdk-extension-javascript` — Fynd extension registration + webhook routing

### Platform Client Operations

```javascript
const platformClient = new PlatformClient({...})

platformClient.companyProfile.getLocations()
platformClient.companyProfile.getLocationDetail(locationId)
platformClient.configuration.getApplications()
platformClient.order.getOrderById(orderId)
platformClient.order.updateShipmentStatus(payload)
```

The FDK extension handler (mounted at root in `index.js`) routes Fynd platform webhooks to registered handlers based on event type.

---

## 7. Google Maps API

**Purpose:** Distance and location calculations.

**Package:** `@googlemaps/google-maps-services-js`

**Key:** `GOOGLE_MAPS_API_KEY`

Used in logistics setup to calculate distances between warehouse locations and customer pincodes for promise range calculations.

---

## Integration Error Handling

All external API calls use a consistent pattern:

```javascript
try {
  const response = await axios.post(url, payload, { headers })
  return response.data
} catch (error) {
  logger.error({ source: 'FLP_API', error: error.message, url })
  Sentry.captureException(error)
  throw createError('EXTERNAL_API_ERROR', error.message, error.response?.status || 500)
}
```

- All errors are logged with source context
- 5xx errors are sent to Sentry
- Error status codes from external APIs are passed through to the client
