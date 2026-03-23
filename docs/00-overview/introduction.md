---
title: Introduction
sidebar_position: 1
---

# Introduction

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

## What Is the Fynd Shopify Ecosystem?

The Fynd Shopify Ecosystem is a collection of **two Shopify merchant apps** and a **shared backend** that allow Indian e-commerce merchants to plug Fynd's logistics network and delivery-promise engine directly into their Shopify stores.

Fynd (by Reliance Retail) operates one of India's largest omnichannel commerce platforms. These apps are the Shopify gateway into that platform.

---

## The Two Apps

### Fynd Promise (`shopify-pincode-checker`)

**What it does:**
Shows customers a delivery date promise ("Delivery by Mon–Wed") before they buy — both on the product page and at checkout.

**How it works:**
1. Merchant installs the app and connects their warehouse locations.
2. The app injects a pincode checker widget on the **product detail page (PDP)** via a Shopify Theme Extension.
3. A **Checkout UI Extension** validates the customer's delivery pincode and shows the promise, with the option to block checkout for unserviceable pincodes.
4. Behind the scenes, the shared backend queries Fynd's serviceability API using the merchant's location config to calculate the delivery window.

**Who it's for:**
Any Indian Shopify merchant who wants to reduce cart abandonment by showing transparent delivery expectations.

**Billing model:**
- Free plan: up to 50 orders/month
- Growth plan: ₹1 per order (usage-based via Shopify billing)

---

### Fynd Logistics (`shopify-logistics-app`)

**What it does:**
Connects Shopify orders to Fynd's fulfillment network so shipments are automatically handed off to Fynd delivery partners.

**How it works:**
1. Merchant installs the app and either creates a new Fynd account or links an existing one (via email OTP).
2. They map their Shopify warehouse locations to Fynd locations.
3. They configure shipping preferences (processing time, delivery promise view, fulfillment mode).
4. When a Shopify order is created, the backend either processes fulfillment synchronously or queues it.
5. Shipment status updates flow back from Fynd to Shopify via webhooks.
6. Merchants can also manage returns and view fulfillment statuses from the Shopify Admin order page via an **Admin UI Extension**.

**Who it's for:**
Indian Shopify merchants who want Fynd to handle pick-up, shipping, and delivery of their orders.

**Billing model:**
- Free plan: up to 50 fulfillments/month
- Growth plan: ₹1 per fulfillment (usage-based via Shopify billing)

---

## The Shared Backend (`shopify-backend`)

A single Node.js/Express server that handles:
- OAuth installation flows for both apps
- Session management (SQLite for Promise, Redis for Logistics)
- All API calls between the Shopify apps and Fynd's platform
- Shopify webhook processing (orders, inventory, fulfillments, returns)
- Fynd platform webhook processing (shipment status updates)
- Usage-based billing via Shopify's billing API
- Merchant configuration storage in MongoDB

---

## Key Constraints

| Constraint | Detail |
|-----------|--------|
| **India only** | Both apps check the Shopify store's `country_code`. Only `IN` stores can use the apps. |
| **Shopify Embedded** | Both apps run embedded inside the Shopify Admin (`embedded = true`). |
| **Shared infra** | Both apps share the same backend deployment; they are distinguished by API key/secret. |
| **Usage-based billing** | Billing is tied to actual order/fulfillment counts via Shopify Usage Records. |
