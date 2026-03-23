---
title: Install Fynd Logistics
sidebar_position: 2
---

# How To: Install Fynd Logistics

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Step-by-step guide for a merchant to install and complete the Fynd Logistics setup.

---

## Prerequisites

- Shopify store in **India**
- A **Fynd company account** OR ability to create one (email required)
- Shopify store on Basic plan or higher

---

## Step 1: Install the App

1. Find **Fynd Logistics** on the Shopify App Store
2. Click **Add app**
3. Review permissions (more extensive than Promise app — includes fulfillments and returns management)
4. Click **Install app**

---

## Step 2: Choose Setup Path

After install, the app shows two options:

### Option A: Link Existing Fynd Account

If you already have a company on the Fynd platform:

1. Click **Link Existing Account**
2. Enter your **company email address**
3. Click **Send OTP** — you'll receive a 6-digit OTP in your email
4. Enter the OTP within 10 minutes
5. Select your **company** from the dropdown
6. Select your **sales channel** (the Shopify channel)
7. Proceed to configuration

### Option B: Create New Account

If you're new to Fynd:

1. Click **Create New Account**
2. Fill in company details:
   - Company name
   - Owner email
   - Phone number
3. Click **Create** — a new Fynd company will be registered
4. Proceed to configuration

---

## Step 3: Configure Logistics Settings

The **FyndSetup** form collects your preferences:

### Warehouse Locations

- Your Shopify locations are fetched automatically
- **Map each Shopify location** to a Fynd location (or create a new one)
- At least one location must be mapped

### Processing Time

- Choose how long it takes to pack an order before courier pickup
- Options: `Fynd Managed` (FLP decides) or `Common` (you set a fixed time in days)
- Example: `1 day` means orders received by cut-off time ship the next day

### Shipping Preference

- **Cheapest** — FLP selects the lowest-cost courier for each shipment
- **Fastest** — FLP selects the fastest available courier
- **Manual** — You choose the courier for each order

### Delivery Promise (optional)

If you also have the Fynd Promise app installed, configure the delivery window displayed to customers.

Click **Save Setup** when done.

---

## Step 4: Verify the Admin Extension

The Fynd Logistics Admin Extension adds a block to your order detail pages:

1. Go to **Shopify Admin → Orders**
2. Open any order
3. You should see a **Fynd Fulfillment** block on the right side
4. This shows fulfillment status and allows manual fulfillment trigger

---

## Step 5: Test Fulfillment

1. Create a test order on your store (use Shopify's bogus gateway for test payments)
2. Go to **Shopify Admin → Orders** → find the test order
3. The Fynd Logistics extension should show the fulfillment status
4. Optionally, trigger fulfillment manually via the extension block

---

## Understanding the Onboarding Flow State

The app tracks your setup progress in Jotai atoms. The current view is stored in `navigationManager`:

| View | Description |
|------|-------------|
| `PROMOTIONAL` | New merchant, hasn't started setup |
| `LINK_EXISTING` | Going through OTP flow |
| `CREATE_NEW` | Creating a new company |
| `EXISTING_SETUP` | Reviewing/editing completed setup |
| `SUCCESS` | Setup complete |

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| OTP not received | Check spam folder; request resend after 10 seconds |
| Company not in list | Make sure you used the correct email; try "Create New Account" |
| Location mapping failed | Ensure the Shopify location has a complete address with pincode |
| Fulfillment extension not showing | Deploy extensions via `shopify app deploy` |
| Orders not being fulfilled | Check logistics is enabled in admin dashboard (`/logistics/admin`) |
