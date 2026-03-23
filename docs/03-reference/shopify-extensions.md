---
title: Shopify Extensions
sidebar_position: 3
---

# Shopify Extensions Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

All Shopify extensions across both apps.

---

## fynd-promise-checkout (Checkout UI Extension)

**App:** shopify-pincode-checker
**Location:** `extensions/fynd-promise-checkout/`

### Configuration

```toml
api_version = "2025-04"
type = "ui_extension"
handle = "fynd-promise"

[[extensions]]
name = "Fynd Promise"
handle = "fynd-promise"
type = "ui_extension"

  [[extensions.targeting]]
  module = "./src/Checkout.jsx"
  target = "purchase.checkout.cart-line-item.render-after"
  export = "cartLineItems"

  [extensions.capabilities]
  api_access = true
  network_access = true
  block_progress = true
```

### Capabilities

| Capability | Value | Why |
|-----------|-------|-----|
| `api_access` | `true` | Needs Storefront API access to read product/variant data |
| `network_access` | `true` | Needs to call `shopify-backend/location/service` |
| `block_progress` | `true` | Can prevent checkout advancement for unserviceable pincodes |

### Render Target

`purchase.checkout.cart-line-item.render-after`

Renders UI after each cart line item in the checkout. The extension appears once per unique product (deduplicated by product ID).

### Key Behaviors

1. **Pincode Input:**
   - Renders a text input asking for delivery pincode
   - Validates: 6 digits, starts with 1-9 (`/^[1-9][0-9]{5}$/`)
   - Shows inline validation error for invalid format

2. **Serviceability Check:**
   - On submit, calls `POST /location/service`
   - Shows loading state during check
   - Handles network errors gracefully

3. **Promise Display:**
   - On success: "Delivery by [promiseDate]"
   - On failure: "Delivery not available for this pincode"

4. **Checkout Blocking:**
   - If `block_progress = true` and pincode is unserviceable, shows a validation error that prevents advancing to payment
   - Configurable behavior — can be set to allow checkout even for unserviceable pincodes

5. **Order Attributes:**
   - Adds `deliveryPincode` to checkout attributes
   - Adds `deliveryPartner` to checkout note attributes

### Localization

| File | Language |
|------|---------|
| `locales/en.default.json` | English |
| `locales/fr.json` | French |

---

## fynd-promise-pdp (Theme Extension)

**App:** shopify-pincode-checker
**Location:** `extensions/fynd-promise-pdp/`

### Configuration

```toml
type = "theme"
name = "Fynd Promise PDP"
```

### Assets

`assets/pincodeService.js` — JavaScript injected into the merchant's storefront theme.

### Key Behaviors

1. **Widget Injection:**
   - Injects a pincode input widget on the Product Detail Page
   - Merchant must activate via Shopify Admin → Themes → Customize → App Blocks

2. **Pincode Check Flow:**
   - Customer types pincode → clicks "Check"
   - Calls `POST /location/service`
   - Shows result inline below the input

3. **Button Management:**
   - Disables "Add to Cart" and "Buy Now" buttons until pincode is checked
   - Re-enables after successful check

4. **Session Persistence:**
   - Stores checked pincode + promise in `sessionStorage`
   - Promise survives page navigation (e.g., variant change)

5. **Variant Change Handling:**
   - Listens for product variant change events
   - Re-checks serviceability if pincode is already set

---

## fullfillment-extension (Admin UI Extension — Order Block)

**App:** shopify-logistics-app
**Location:** `extensions/fullfillment-extension/`

### Configuration

```toml
api_version = "2025-04"
type = "ui_extension"
handle = "fullfillment-extension"

[[extensions]]
name = "Fynd Fulfillment"
handle = "fullfillment-extension"

  [[extensions.targeting]]
  module = "./src/BlockExtension.jsx"
  target = "admin.order-details.block.render"

[[extensions]]
name = "Fynd Returns"
handle = "fynd-returns"

  [[extensions.targeting]]
  module = "./src/ReturnBlockExtension.jsx"
  target = "admin.order-details.block.render"
```

### BlockExtension.jsx

Renders on the Shopify Admin order details page to show Fynd fulfillment status.

**What it shows:**
- Current fulfillment status (queued, processing, fulfilled, error, cancelled)
- Fynd shipment ID
- AWB (airway bill) number
- Delivery partner name
- Tracking URL (if available)
- Error details (if `status === "error"`)

**API calls:**
```
GET /logistics/fulfill/orders/:orderId/fulfillment-status
GET /logistics/fulfill/orders/:orderId/fulfillment-orders
```

**Actions available:**
- Trigger fulfillment (if not yet fulfilled)
- View shipment documents (label, invoice)

### ReturnBlockExtension.jsx

Renders on the same order details page to handle returns.

**What it shows:**
- Return eligibility status
- Existing return requests for this order
- Return reason selection
- Items selection for partial returns

**API calls:**
```
GET /logistics/orders/:orderId/fulfillments/return-eligibility
POST /logistics/returns
```

### Dependencies

```json
{
  "@shopify/ui-extensions": "2025.4.x",
  "@shopify/ui-extensions-react": "2025.4.x"
}
```

---

## Fynd Promise Checkout (in Logistics App)

**App:** shopify-logistics-app
**Location:** `extensions/fynd-promise-checkout/`

Note: The logistics app also ships the Fynd Promise checkout extension. This is the same extension as in the pincode-checker app but deployed from the logistics app context. Both apps register to the same Shopify extension handle.

---

## Extension Deployment

Extensions are deployed as part of the Shopify app using:

```bash
shopify app deploy
```

This bundles and uploads all extensions in the `extensions/` directory to Shopify.

**Environment-specific deploys:**

```bash
# Deploy to specific environment
shopify app deploy --config shopify.app.fynd-logistics-uat.toml
```

Extensions must be deployed to be tested in certain contexts:
- Checkout UI extensions cannot be previewed locally
- Admin UI extensions can be tested locally with `shopify app dev`
