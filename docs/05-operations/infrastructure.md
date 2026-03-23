---
title: Infrastructure
sidebar_position: 2
---

# Infrastructure

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How the Fynd Shopify services are deployed and managed.

---

## Deployment Framework: FIK

All services are deployed using **FIK (Fynd Infrastructure Kit)** — Fynd's internal Kubernetes deployment framework similar to Helm. FIK reads YAML configuration files from the `fik-fynd-extensions` repository.

### FIK Config Repository

```
fik-fynd-extensions/
├── base_values/
│   ├── values.yaml                    # Global defaults
│   └── projects/
│       ├── shopify-app.yaml           # Promise + Backend base config
│       └── logistics.yaml             # Logistics app base config
└── environments/
    ├── fynd/m2/projects/              # Production configs
    ├── fynd/fyndz5/m1/projects/       # UAT configs
    └── fynd/fyndz0/m1/projects/       # SIT configs
```

---

## Kubernetes Resources per Service

### shopify-backend

```yaml
service: shopify-backend.extensions
cluster: ext
ingress:
  prefix: shopify-backend.extensions
  domain: FyndPlatform

containers:
  - type: server
    replicas: { desired: 1, min: 1, max: 20 }
    resources:
      requests: { cpu: 100m, memory: 400Mi }
      limits: { cpu: 500m, memory: 1000Mi }

  - type: cronJob
    name: BillingCronJob
    schedule: "0 0 7,14,21,28 * *"
    env:
      MODE: cron
      CRON_JOB: billing_trigger

databases:
  - type: mongodb
    name: SHOPIFY_BACKEND
    access: [READ_WRITE, READ_ONLY]
  - type: redis
    name: SHOPIFY_BACKEND
    access: [READ_WRITE, READ_ONLY]
```

### shopify-pincode-checker

```yaml
service: pincode-checker.extensions
cluster: ext
ingress:
  prefix: pincode-checker.extensions
  domain: FyndPlatform

containers:
  - type: server
    replicas: { desired: 1, min: 1, max: 20 }
    resources:
      requests: { cpu: 100m, memory: 400Mi }
```

### shopify-logistics-app

```yaml
service: shopify-logistics.extensions
cluster: ext
ingress:
  prefix: shopify-logistics.extensions
  domain: FyndPlatform

containers:
  - type: server
    replicas: { desired: 1, min: 1, max: 20 }
    resources:
      requests: { cpu: 100m, memory: 400Mi }
```

---

## Docker Images

All services use **multi-stage Docker builds**:

**Base image:** `node:22-alpine`

**Build process:**
1. Install Python, gcc, g++ (for native npm modules)
2. Configure Azure DevOps private registry access
3. `npm ci --legacy-peer-deps`
4. Copy source code

**Runtime:**
1. Copy built app from builder stage
2. Expose port (8081 for frontends, 8000 for backend)
3. `CMD: npm start`

---

## Network Architecture

```
Internet
    ↓
Nginx Ingress Controller (Kubernetes)
    ↓ (routes by hostname)
    ├── pincode-checker.extensions.* → shopify-pincode-checker pods
    ├── shopify-backend.extensions.* → shopify-backend pods
    └── shopify-logistics.extensions.* → shopify-logistics-app pods
```

**CORS:** The backend uses `ALLOWED_DOMAINS_REGEX` to whitelist allowed origins. Shopify Admin domains and the app domains are in the allowed list.

**Nginx config:** The logistics app has a custom nginx body size limit to handle large fulfillment payloads.

---

## Secrets Management

Target state for secrets management:
1. **Kubernetes Secrets** — injected as environment variables at runtime
2. **FIK Vault integration** — secrets fetched from HashiCorp Vault during deployment
3. **ExternalSecrets** — synced from Vault to Kubernetes Secrets

Current state note:
- Some environment project YAMLs still contain inline secret-like values under `CommonEnvs`.
- This should be treated as migration debt and moved to Vault/Kubernetes secret references.

Policy:
- Do not add new secrets to git-tracked files.
- Keep `.env` files local-only and gitignored.

---

## Scaling

All services autoscale based on CPU/memory:
- Minimum: 1 replica
- Maximum: 20 replicas (server), 5 replicas (workers)

The `FULFILLMENT_PROCESSING_MODE=memory-queue` option allows horizontal scaling of fulfillment processing without external queue infrastructure.

---

## Health Checks

All services expose health endpoints used by Kubernetes:

| Endpoint | Kubernetes Probe | Success Criteria |
|----------|-----------------|-----------------|
| `/_healthz` | Liveness probe | 200 OK = process alive |
| `/_readyz` | Readiness probe | 200 OK = ready to accept traffic |

If `/_readyz` returns non-200, Kubernetes stops sending traffic to that pod until it recovers.
