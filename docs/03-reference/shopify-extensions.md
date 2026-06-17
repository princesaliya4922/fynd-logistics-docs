---
title: Shopify Extensions
sidebar_position: 3
---

# Shopify Extensions Reference

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

All Shopify extensions across both apps (`services/shopify-pincode-checker` and `services/shopify-logistics-app` in the `shopify-apps` monorepo).

---

## fynd-promise-checkout (Checkout UI Extension)

**App:** shopify-pincode-checker
**Location:** `extensions/fynd-promise-checkout/`

### Configuration

`api_version` is the only top-level key; `handle` lives inside `[[extensions]]`. The toml also has a stray, uncommented `[extensions.settings]`-style `banner_title` field (the section header itself is commented out) and a commented-out alternate target `purchase.checkout.cart-line-list.render-after`.

```toml
api_version = "2025-04"

[[extensions]]
name = "Fynd Promise"
handle = "fynd-promise"
type = "ui_extension"

  # commented-out alternate target:
  #[[extensions.targeting]]
  #module = "./src/Checkout.jsx"
  #target = "purchase.checkout.cart-line-list.render-after"
  #export = "cartLineItems"

  [[extensions.targeting]]
  module = "./src/Checkout.jsx"
  target = "purchase.checkout.cart-line-item.render-after"
  export = "cartLineItems"

[extensions.capabilities]
api_access = true
network_access = true
block_progress = true

# stray uncommented field (no effect):
key = "banner_title"
type = "single_line_text_field"
name = "Banner title"
```

### Capabilities

| Capability | Value | Why |
|-----------|-------|-----|
| `api_access` | `true` | Storefront API access |
| `network_access` | `true` | Needs to call `https://shopify-backend.extensions.fynd.com/location/service` |
| `block_progress` | `true` | Can prevent checkout advancement for unserviceable pincodes |

### Render Target

`purchase.checkout.cart-line-item.render-after`

Renders once **per cart line** (`useCartLineTarget`). There is **no** deduplication by product ID.

### Key Behaviors

1. **No input field:**
   - The extension renders only a `<Text>` message — it does **not** render a pincode input.
   - It reads the pincode from the buyer's **shipping address** (`useShippingAddress().zip`).

2. **Auto serviceability check:**
   - Fires automatically when the shipping zip changes, is 6 digits, and `countryCode === 'IN'`.
   - Validates the shipping zip with `/^[1-9][0-9]{5}$/`.
   - `POST`s `{ data: <cart line target>, shop, pincode }` to `/location/service`.

3. **Promise display:**
   - Renders `responseData.message`, styled success/warning based on `status`.

4. **Checkout blocking:**
   - Via `useBuyerJourneyIntercept`: blocks when `checkData.status === false` (uses `message` as the reason).

5. **Order note (not attributes):**
   - Sets **no** checkout attributes. On success it applies an order **note** via `applyNoteChange`:
     `Suggested Delivery Partner: <dateRange.name>,\nExpected Promise: <message>`.

### Localization

`locales/en.default.json` and `locales/fr.json` exist but are **unused placeholders** — the displayed English strings are hardcoded in `Checkout.jsx`.

---

## fynd-promise-pdp (Theme Extension)

**App:** shopify-pincode-checker
**Location:** `extensions/fynd-promise-pdp/`

### Configuration

```toml
type = "theme"
name = "Fynd Promise PDP"
```

This is a **theme app block**. The directory and toml name are "Fynd Promise PDP", but the block merchants add is named **"Fynd Pincode Service"** (the `name` in `blocks/pincode_service.liquid`'s `{% schema %}`).

### Files

- `blocks/pincode_service.liquid` — block markup, styles, and merchant settings schema (block name "Fynd Pincode Service")
- `snippets/stars.liquid`
- `assets/pincodeService.js` + image assets

### Key Behaviors

1. **Input + button:** renders a pincode input and a Check button on the Product Detail Page. Merchant must activate via Shopify Admin → Themes → Customize → App Blocks.

2. **Pincode check flow:** customer types pincode → clicks Check → `POST /location/service` with `{ pincode, productId, shop, variantId, sku }` → result shown inline. Consumes `content.status`, `content.message`, `content.dateRange.name`.

3. **Button management:** disables a large hardcoded `textsToDisable` list (~33 button labels, e.g. "add to cart", "buy now", "checkout now") until a serviceable pincode is checked; re-enables on success.

4. **Cart note on success:** writes the promise as a **cart note** via `POST /cart/update.js` (`Suggested PDP Delivery Partner: ... / Expected PDP Promise: ...`).

5. **Merchant settings:** honors `allow_checkout_on_empty_or_invalid_pincode`, `allow_checkout_on_unserviceable_pincode`, and `use_custom_pincode_button_text` / `custom_pincode_button_text`.

6. **`requires_shipping` short-circuit:** for variants that don't require shipping, it skips the check and allows checkout ("No shipping required for this product").

7. **Gating metafield:** reads `shop.metafields.settings.fyndWidget`.

8. **Session persistence:** stores checked pincode + result in `sessionStorage`; survives navigation.

9. **Variant change handling:** re-checks serviceability on variant switch if a pincode is already set.

---

## fullfillment-extension (Admin UI Extension — Order Block)

**App:** shopify-logistics-app
**Location:** `extensions/fullfillment-extension/`

### Configuration

`api_version` is `2025-07` (not `2025-04`). The merchant-facing names are **translation keys** (`name = "t:name"` / `"t:return_block_name"`), resolved from `locales/en.default.json`. Each target sets `network_access = true` directly; there is **no** `[extensions.capabilities]` block.

```toml
api_version = "2025-07"

[[extensions]]
name = "t:name"
handle = "fullfillment-extension"
type = "ui_extension"

  [[extensions.targeting]]
  module = "./src/BlockExtension.jsx"
  target = "admin.order-details.block.render"
  network_access = true

[[extensions]]
name = "t:return_block_name"
handle = "fynd-returns"
type = "ui_extension"

  [[extensions.targeting]]
  module = "./src/ReturnBlockExtension.jsx"
  target = "admin.order-details.block.render"
  network_access = true
```

### BlockExtension.jsx

Renders on the Shopify Admin order details page to show Fynd fulfillment status. All backend calls use `BASE_URL = 'https://shopify-backend.extensions.fynd.com'`.

**API calls:**
```
GET  /logistics/fulfill/orders/:orderId/fulfillment-orders?shop=<domain>
POST /logistics/fulfill/fulfillment
POST /logistics/fulfill/fulfillment/carrier-assignment-status
```

> There is **no** `fulfillment-status` endpoint — that route does not exist. Status is derived from carrier-assignment state keys, not from `queued` / `processing` / `fulfilled`.

**Status keys it branches on:** `carrier_assigned`, `carrier_assignment_failed`, `carrier_assignment_pending`, `not_trackable`, `error`, and an `FO OPEN` (fulfillment-order open) state.

**Actions available:**
- Trigger fulfillment / check carrier-assignment status.
- (No "view documents" / label / invoice action lives in this extension — see `order-print-ship-label-action` below for label retrieval.)

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

---

## order-fullfilment (Admin Action Extensions — Logistics App)

**App:** shopify-logistics-app
**Location:** `extensions/order-fullfilment/`

This single toml (`api_version = "2025-07"`) declares **three** UI extensions, each with `network_access = true`:

| Handle | Target | Module |
|--------|--------|--------|
| `order-fullfilment` | `admin.order-details.action.render` | `./src/ActionExtension.jsx` |
| `order-bulk-fullfilment` | `admin.order-index.selection-action.render` | `./src/OrdersIndexExtension.jsx` |
| `order-print-ship-label-action` | `admin.order-details.action.render` | `./src/PrintShipLabelActionExtension.jsx` |

All call `BASE_URL = 'https://shopify-backend.extensions.fynd.com'`.

**Key API calls:**
```
POST /logistics/fulfill/orders/bulk                              (ActionExtension, OrdersIndexExtension)
GET  /logistics/fulfill/orders/:orderId/fulfillment-orders       (ActionExtension)
POST /logistics/fulfill/fulfillment/carrier-assignment-status    (ActionExtension)
POST /logistics/shipments/documents (docTypes: ['label_a4'])     (PrintShipLabelActionExtension)
```

`PrintShipLabelActionExtension.jsx` reads the print URL from `record.documents.label_a4.signed_url`.

> **Print Ship Label clarification:** an earlier commit removed only `PrintShipLabelExtension.jsx` (a Print-dropdown variant). `PrintShipLabelActionExtension.jsx` (handle `order-print-ship-label-action`) **still exists** — the Print Ship Label feature was not fully removed.

---

## Shared handle collision risk

Both `shopify-pincode-checker` and `shopify-logistics-app` register a checkout extension with the handle **`fynd-promise`**. This is a shared/duplicated handle across two apps — flag as a potential collision risk when deploying.

---

## Fynd Promise Checkout (in Logistics App)

**App:** shopify-logistics-app
**Location:** `extensions/fynd-promise-checkout/`

Note: The logistics app also ships a Fynd Promise checkout extension (handle `fynd-promise`). It is a copy of the pincode-checker checkout extension deployed from the logistics app context; its toml/`api_version` may differ from the pincode-checker copy.

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
