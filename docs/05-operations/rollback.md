---
title: Rollback
sidebar_position: 6
---

# Rollback Procedures

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

---

## Application Rollback (Kubernetes)

### Using FIK CLI

```bash
# Roll back shopify-backend to previous version
fik rollback shopify-backend --env fynd/m2

# Roll back specific service
fik rollback shopify-logistics --env fynd/m2
```

### Using kubectl

```bash
# View rollout history
kubectl rollout history deployment/shopify-backend -n ext

# Roll back to previous revision
kubectl rollout undo deployment/shopify-backend -n ext

# Roll back to specific revision
kubectl rollout undo deployment/shopify-backend --to-revision=3 -n ext

# Verify rollback
kubectl rollout status deployment/shopify-backend -n ext
```

---

## Docker Image Rollback

If you need to deploy a specific previous image version:

1. Find the previous image tag in Azure Container Registry
2. Update FIK config to use that image tag
3. Deploy via FIK

---

## Database Rollback

**MongoDB has NO automatic rollback** — schema changes and data writes are permanent.

For data corruption:
1. Identify the time of corruption
2. Restore from MongoDB Atlas backup (point-in-time recovery)
3. **Contact DBA / Platform team** for production data restores

**Prevention:** Never run destructive migrations without a backup snapshot.

---

## Shopify Extension Rollback

Shopify extensions versioned separately. If a bad extension version is deployed:

1. Revert extension code in the repo
2. Run `shopify app deploy` to push the previous version
3. Extensions update automatically for all stores

**Note:** Extension changes are backwards-compatible in most cases. Shopify maintains version history.

---

## Rollback Checklist

- [ ] Identify the bad deploy (check Sentry, logs, metrics)
- [ ] Alert team of rollback
- [ ] Execute rollback (kubectl or FIK)
- [ ] Verify health endpoints return 200
- [ ] Verify Sentry error rate drops
- [ ] Confirm functionality with a test request
- [ ] Write post-mortem
