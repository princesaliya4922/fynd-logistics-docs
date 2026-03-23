---
title: "ADR-002: India-Only Restriction"
sidebar_position: 2
---

# ADR-002: India-Only Restriction

> **Status:** Accepted
> **Owner:** Engineering — Fynd Extensions Team
> **Date:** 2024 (reconstructed)
> **Last Updated:** 2026-03-23

---

## Context

Fynd's logistics network and serviceability data are exclusively India-focused. Pincodes are an India-specific addressing system (6-digit postal codes). Fynd's courier partner integrations cover Indian logistics routes only.

## Decision

Both apps check `shop.country_code === 'IN'` at startup via `RegionHandle.jsx`. Stores outside India see an error message and cannot access any features.

## Where It's Enforced

1. **Frontend:** `RegionHandle.jsx` in both apps — calls `GET /api/shop`, checks `country_code`
2. **Backend:** `fyndIntegration.js` — checks country code before registering with Fynd backend

## Rationale

- Fynd's pincode serviceability API only knows Indian pincodes
- Fynd's courier partner network is India-only
- Billing is in INR — Shopify billing in other currencies not configured
- Legal and compliance considerations for the India market
- Displaying incorrect delivery promises to non-India stores would be misleading/harmful

## Consequences

**Positive:**
- No incorrect behavior for international merchants
- Focused product scope

**Negative:**
- International Fynd merchants using Shopify cannot use these apps
- Any future international expansion requires changes to both frontend and backend

## Future Considerations

If international expansion is needed:
- Replace hard `=== 'IN'` check with a configurable list of supported countries
- Add country-specific serviceability API integrations
- Update billing to support multiple currencies
