---
title: Install Fynd Promise
sidebar_position: 1
---

# How To: Install Fynd Promise

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Step-by-step guide for a merchant to install and configure the Fynd Promise app.

---

## Prerequisites

- A Shopify store located in **India** (country = India)
- Shopify store must be on the **Basic plan or higher** (required for embedded apps)
- Admin access to the Shopify store

---

## Step 1: Find the App

The Fynd Promise app is available at:
- Shopify App Store listing (under "Fynd Promise" or "Fynd Delivery Promise")
- Direct install link: `https://pincode-checker.extensions.fynd.com/`

---

## Step 2: Install the App

1. Click **Add app** on the Shopify App Store listing
2. You'll be redirected to the Shopify permissions screen
3. Review the required permissions:
   - Read orders, products, inventory, locations
   - Write orders, products, script tags
4. Click **Install app**
5. Shopify installs the app and redirects you to the app dashboard

---

## Step 3: Subscribe to a Plan

On first open, you'll see the plan selection screen:

| Plan | Orders/month | Cost |
|------|-------------|------|
| **Free** | Up to 50 | ₹0 |
| **Growth** | Unlimited | ₹1/order |

1. Select your plan
2. Click **Approve** on the Shopify billing confirmation page
3. You'll be redirected back to the app

---

## Step 4: Configure Delivery Settings

After subscribing, the **Settings** page opens with the **Delivery Widget**:

1. **Select your warehouse location** from the dropdown (fetched from your Shopify locations)
2. **Set delivery promise view:**
   - **Range** — shows "Delivery by Mon–Wed"
   - **Fixed** — shows "Delivery by Wednesday"
3. **Set processing time** — how many days you need to pack before handoff to courier
4. Click **Save**

---

## Step 5: Set Up the PDP Widget (Product Pages)

The pincode checker on product pages requires activating a theme block:

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Customize** on your active theme
3. Navigate to any product page template
4. Click **Add block** → **Apps** → **Fynd Promise PDP**
5. Position the block where you want the pincode checker to appear (recommended: below the price)
6. Click **Save**

---

## Step 6: Test the Checkout Extension

The checkout pincode checker is automatically active once the app is installed. Test it:

1. Open your storefront in a customer browser
2. Add a product to cart
3. Proceed to checkout
4. You should see the Fynd Promise pincode checker below the cart items
5. Enter a valid Indian pincode (e.g., `400001`)
6. Verify that the delivery promise message appears

---

## Verifying Installation

To confirm everything is working:

1. Open the app dashboard (Shopify Admin → Apps → Fynd Promise)
2. You should see **Step Progress** showing your configured settings
3. The dashboard shows current plan, orders used, and configuration status

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| App shows "Store not available in your region" | Your store's country must be set to India in Shopify Admin → Settings → Store details |
| Plan selection page won't load | Check your internet connection; try refreshing |
| PDP widget not appearing | Make sure you activated the theme block in Step 5 |
| Checkout extension not showing | Extensions may take a few minutes to propagate after install |
| Pincode check returns error | Check that `shopify-backend` is healthy (ops team) |
