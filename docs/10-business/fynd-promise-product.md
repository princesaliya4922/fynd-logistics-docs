---
title: Fynd Promise — Product Overview
sidebar_position: 1
---

# Fynd Promise — Product Overview

> **Owner:** Product & Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## What Is Fynd Promise?

**Fynd Promise** is a Shopify app that shows customers a delivery date promise before they buy.

**The problem it solves:**
Indian e-commerce shoppers frequently abandon carts because they don't know when their order will arrive. Transparent delivery windows reduce this uncertainty and increase conversion rates.

**The solution:**
- On the **product page**: A pincode checker shows "Delivery by Mon–Wed" if you enter your delivery pincode
- At **checkout**: The same promise is shown next to each cart item, and unserviceable pincodes can be blocked

---

## Target Merchants

- Indian Shopify merchants using D2C (Direct-to-Consumer) model
- Merchants who ship via Fynd's logistics network OR standard couriers
- Merchants who want to reduce cart abandonment through delivery transparency

---

## Key Value Propositions

| Value | How |
|-------|-----|
| Reduce cart abandonment | Customers know delivery date before checkout |
| Build trust | Transparent, accurate promises from real serviceability data |
| Plug-and-play | Works with existing Shopify theme (PDP extension) and checkout |
| India-specific | Built for Indian pincodes and courier SLAs |

---

## User Journey (Customer)

```
1. Customer lands on product page
2. Sees pincode checker: "Check delivery for your pincode"
3. Enters 6-digit pincode
4. App checks: is this pincode serviceable from merchant's warehouse?
5. Shows: "Delivery by Mon 25 Mar – Wed 27 Mar ✓"
   (or "Delivery not available in your area")
6. Customer proceeds to checkout with confidence
7. At checkout: same promise shown again next to cart items
8. Customer checks out ✓
```

---

## Business Metrics

- **Free plan:** First 50 orders/month are free
- **Growth plan:** ₹1 per order (usage-based, ₹999 cap/month)
- App is billed via Shopify's native billing system (no separate payment integration needed)

---

## Integration Points

| Touch Point | What Happens |
|-------------|-------------|
| Product page (PDP) | Theme Extension shows pincode checker widget |
| Cart/Checkout | Checkout UI Extension shows promise + optionally blocks unserviceable checkout |
| Admin dashboard | Merchant configures warehouse location and promise settings |
| Fynd Serviceability API | Powers the actual pincode lookup |

---

## Limitations

- **India only** — Only works for stores with country = India
- **Requires warehouse setup** — Merchant must configure at least one warehouse location
- **Pincode coverage** — Serviceability depends on Fynd's courier network coverage (varies by courier and region)
- **Theme activation** — PDP widget requires manual activation in Shopify theme customizer
