---
title: CI/CD
sidebar_position: 4
---

# CI/CD Pipeline

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-06-17

---

## Pipeline Overview

The current source-of-truth deployment pipeline is the **top-level monorepo pipeline**:

```
shopify-apps/
└── azure-pipeline.yaml
```

It is tag-triggered only:

```yaml
trigger:
  tags:
    include:
      - "deploy.*"

pr: none
```

The pipeline extends `Infrastructure/kube-infrastructure` (`ref: fyndone`) and passes these monorepo parameters:

| Parameter | Current Value |
|-----------|---------------|
| `services` | `shopify-pincode-checker`, `shopify-logistics-app`, `shopify-backend` |
| `servicePathPrefix` | `services` |
| `serviceDockerfile` | `Dockerfile` |
| `sonarKeyPrefix` | `fyndone:shopify-apps` |
| `buildOnlyWhenChanged` | `true` |
| `maxParallel` | `5` |

Each service still has an `azure-pipelines.yml` file under its service directory from the pre-monorepo layout, but the root `azure-pipeline.yaml` is the active monorepo entry point.

---

## Deployment Tags

Create deployment tags with:

```bash
cd shopify-apps
source scripts/tagdeploy.sh
tagdeploy <env>
```

Examples:

```bash
tagdeploy cmlz0
tagdeploy fynd
tagdeploy cmlz0 --build-all
tagdeploy cmlz0 --services shopify-backend,shopify-logistics-app
```

`tagdeploy.sh` behavior:

| Env Type | Tag Format | Branch Guard |
|----------|------------|--------------|
| Production env names such as `fynd`, `jioecomm`, `tira`, `pixelbin` | `deploy.<env>` (force-updated) | Allows `master`, `master-opt`, `docker-master`, `GAR`, `kube` |
| Other env names | `deploy.<env>.<timestamp>` | No production branch guard |

Optional tag messages are used by the infrastructure template:

| Option | Tag Message |
|--------|-------------|
| `--build-all` | `BuildAll: true` |
| `--services <csv>` | `BuildServices: <csv>` |

---

## Branch and Sync Workflow

The monorepo keeps UAT and production snapshots in different branches and can sync from the legacy source repositories:

```bash
./scripts/sync_uat_services.sh
./scripts/sync_production_services.sh
```

| Monorepo Branch | Service | Legacy Source Branch |
|-----------------|---------|----------------------|
| `uat` | `shopify-logistics-app` | `uat` |
| `uat` | `shopify-pincode-checker` | `sit` |
| `uat` | `shopify-backend` | `uat` |
| `production` | `shopify-logistics-app` | `production` |
| `production` | `shopify-pincode-checker` | `master` |
| `production` | `shopify-backend` | `production` |

Typical workflow:

1. Checkout `uat` or `production` in `shopify-apps`.
2. Run the matching sync script if pulling changes from legacy repos.
3. Review and commit the service snapshot changes.
4. Push the branch.
5. Create a `deploy.*` tag with `tagdeploy`.

---

## Local Test Commands

There is no root npm workspace command that runs every service. Run commands inside the relevant service directory.

| Service | Commands |
|---------|----------|
| `services/shopify-backend` | `npm test`, `npm run test:coverage`, `npm run lint`, `npm run create-indexes` |
| `services/shopify-pincode-checker` | `npm test`, `npm run test:coverage`, `npm run build`, `npm run dev`, `npm run deploy` |
| `services/shopify-pincode-checker/web` | `npm run dev`, `npm run serve` |
| `services/shopify-logistics-app` | `npm test`, `npm run test:coverage`, `npm run build`, `npm run dev`, `npm run deploy` |
| `services/shopify-logistics-app/web` | `npm run dev`, `npm run serve` |

---

## Shopify Extension Deployment

Shopify extensions are deployed through Shopify CLI from the relevant app service root:

```bash
cd services/shopify-pincode-checker
npm run deploy

cd ../shopify-logistics-app
npm run deploy
```

`npm run deploy` maps to `shopify app deploy`. Extension deploys update Shopify-hosted extension assets and do not require merchants to reinstall the app.

---

## Deployment Verification

After a deploy:

```bash
curl -i https://shopify-backend.extensions.fynd.com/
curl -I https://shopify-backend.extensions.fynd.com/api-docs
```

Current backend behavior:

- `GET /` returns `200 OK` HTML.
- `/_healthz` and `/_readyz` are not implemented and return the standard 404 JSON.
- Check Sentry, New Relic, Grafana/Prometheus files, Kubernetes logs, and the Shopify app install/extension flows for functional verification.

---

## Rollback Process

See [Operations -> Rollback](./rollback.md) for rollback procedures.
