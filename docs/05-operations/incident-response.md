---
title: Incident Response
sidebar_position: 5
---

# Incident Response

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|--------------|
| P1 | Production down, all merchants affected | Immediate |
| P2 | Major feature broken (e.g., fulfillment failing for all stores) | < 1 hour |
| P3 | Feature degraded (e.g., slow response times) | < 4 hours |
| P4 | Minor issue, workaround available | Next sprint |

---

## Common Incidents and Runbooks

### Fulfillments Not Processing

**Symptoms:**
- Orders created in Shopify but not showing in Fynd
- `shipments.status` stuck at `queued`
- Sentry alerts for `FLP_CREATE_FAILED`

**Investigation:**
```bash
# 1. Check backend health
curl https://shopify-backend.extensions.fynd.com/_healthz

# 2. Check MongoDB for stuck orders
db.shipments.find({ status: "queued", createdAt: { $lt: new Date(Date.now() - 10*60000) } })

# 3. Check FLP API status (contact Fynd Platform team)

# 4. Check if logistics is enabled for affected shop
db.stores.findOne({ shop: "affected-store.myshopify.com" }, { logistics_status: 1 })
```

**Fix:**
- If FLP is down: wait for FLP recovery, shipments will auto-retry
- If `logistics_status = "disabled"`: enable via admin panel
- If stuck in queue: trigger manual fulfillment via Admin Extension

---

### Webhooks Not Being Received

**Symptoms:**
- Orders created in Shopify but no MongoDB records
- No HMAC auth logs for expected topics

**Investigation:**
```bash
# 1. Check Shopify webhook delivery in Shopify Partners dashboard
# Partners → Apps → Your App → Webhooks → Delivery history

# 2. Check if webhooks are registered correctly
# (Should be done during install - check fyndIntegration.js ran)
db.stores.findOne({ shop: "affected.myshopify.com" })

# 3. Check ngrok in development (tunnels may have expired)
```

**Fix:**
- Reinstall app to re-register webhooks
- Check `HOST` env var matches actual public URL

---

### Merchants Getting "Region Not Supported"

**Symptoms:**
- Merchant reports app not loading
- They see "not available in your region" error

**Investigation:**
```javascript
// Check merchant's store country
// In Shopify Admin: Settings → Store details → Store address → Country
```

**Fix:**
- Merchant needs to update their Shopify store country to India
- This is a valid business restriction — app is India-only

---

### Billing Cron Not Running

**Symptoms:**
- Subscriptions have past `billingCycleEnd` but no Usage Records created
- Merchants complaining about wrong billing

**Investigation:**
```bash
# Check last cron execution
# Look for cron job logs in Kubernetes
kubectl logs -n ext -l job-name=shopify-backend-billing-cron --previous

# Check subscriptions that should have been billed
db.subscriptions.find({
  status: "active",
  billingCycleEnd: { $lt: new Date() }
})
```

**Fix:**
- Run billing manually: `GET /config/billingCron`
- Or run cron process directly: `MODE=cron CRON_JOB=billing_trigger node server.js`

---

### MongoDB Connection Issues

**Symptoms:**
- 500 errors on all endpoints
- Log: `MongoNetworkError: connect ECONNREFUSED`

**Fix:**
- Check MongoDB cluster status (Atlas dashboard or internal monitoring)
- Verify `MONGO_SHOPIFY_BACKEND_READ_WRITE` connection string is correct
- Restart pods if connection pool is corrupted: `kubectl rollout restart deployment shopify-backend`

---

## Escalation Path

1. On-call engineer (PagerDuty)
2. Team lead
3. Platform infrastructure team (MongoDB/Redis/Kubernetes issues)
4. Fynd Platform team (FLP/OMS/Central API issues)
5. Shopify Partner support (Shopify platform issues)

---

## Post-Incident Process

After every P1/P2 incident:
1. Write a brief post-mortem (what happened, root cause, fix, prevention)
2. Create a ticket for any long-term fixes
3. Update monitoring/alerts if the incident could have been detected earlier
4. Update this runbook with the new scenario if applicable
