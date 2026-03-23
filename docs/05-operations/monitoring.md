---
title: Monitoring
sidebar_position: 3
---

# Monitoring

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

How to monitor the health and performance of the Fynd Shopify Ecosystem.

---

## Sentry (Error Tracking)

All three services integrate with **Sentry** for real-time error tracking.

### Sentry Projects

| Service | Environment | Project |
|---------|-------------|---------|
| shopify-backend | UAT | `sentry.fynd.engineering/845` |
| shopify-backend | Production | `o71740.ingest.us.sentry.io/4509043013713920` |
| shopify-pincode-checker | UAT | `sentry.fynd.engineering/807` |
| shopify-pincode-checker | Production | `o71740.ingest.us.sentry.io/4509043013124097` |

### What Gets Reported

- Unhandled exceptions in Node.js (server-side)
- 5xx error responses (not 4xx — those are client errors)
- Slow transactions (performance monitoring)
- Frontend errors (browser-side React errors)

### Sentry Configuration

```javascript
// In web/sentry.js (all apps)
Sentry.init({
  dsn: config.get('sentry_dsn'),
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,    // 100% of transactions
  profilesSampleRate: 1.0,  // 100% profiled
  environment: process.env.NODE_ENV
})
```

### Alert Rules

- New errors trigger immediate alerts to the on-call engineer
- Error spike detection: >10 new errors/min triggers PagerDuty

---

## PagerDuty (On-Call Alerting)

PagerDuty is configured for production incident alerting.

**On-call contacts:**
- Primary: Engineering team member (rotates weekly)
- Escalation contacts configured in FIK (`fik-fynd-extensions` integrations config)

**Alert triggers:**
- Sentry error spikes
- Pod crash loops (Kubernetes)
- Health check failures (`/_healthz`, `/_readyz`)
- Ingress 5xx error rate exceeding threshold

---

## New Relic (APM)

New Relic Application Performance Monitoring is available for production environments.

**Enabled for:** `fynd` (production), `fyndz6`+

**Configuration:**
```bash
NEW_RELIC_ENABLED=true
NEW_RELIC_APP_NAME=shopify-backend
NEW_RELIC_LICENSE_KEY=<key>
NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
```

**What to monitor:**
- Request throughput (req/s)
- Response time (P50, P95, P99)
- Error rate
- Transaction traces for slow requests
- External API call latency (Fynd Central, FLP)

---

## Prometheus / Grafana (Metrics)

The backend exports Prometheus metrics via `prom-file-client`.

**Metrics exported:**
- HTTP request count by method, path, status code
- HTTP request duration histogram
- Active connections

**Configuration:**
```bash
METRICS_DIR=/path/to/metrics  # Directory where metrics files are written
```

These are scraped by the Prometheus instance in the Kubernetes cluster and displayed in Grafana dashboards.

---

## Winston Logging

All three services use **Winston** for structured JSON logging.

### Log Format

```json
{
  "level": "info",
  "message": "Order fulfilled successfully",
  "service": "shopify-backend",
  "timestamp": "2026-03-23T10:00:00.000Z",
  "shop": "my-store.myshopify.com",
  "orderId": "order-123"
}
```

### Log Levels

| Level | When Used |
|-------|----------|
| `debug` | Detailed debugging info (disabled in production) |
| `info` | Normal operations: installs, fulfillments, webhooks |
| `warn` | Client errors (4xx), recoverable issues |
| `error` | Server errors (5xx), exceptions |

### Log Transport

- **Console** — all environments (captured by Kubernetes log aggregation)
- **Sentry** — error-level logs in production

---

## Key Metrics to Watch

| Metric | Normal Range | Alert Threshold |
|--------|-------------|----------------|
| HTTP 5xx rate | < 0.1% | > 1% |
| Webhook processing time | < 5s | > 30s |
| MongoDB query time | < 100ms | > 1s |
| Redis latency | < 10ms | > 100ms |
| FLP API response time | < 2s | > 10s |
| Billing cron duration | < 5 min | > 30 min |

---

## BigQuery DLQ Monitoring

For data pipeline issues, check the Dead Letter Queue:

```sql
SELECT * FROM `fynd-jio-commerceml-prod.temp_zenith_data.dbe_dlq`
WHERE dataset = 'shopify_backend'
ORDER BY created_at DESC
LIMIT 100
```

This shows records that failed the BigQuery transformation pipeline.

Looker Studio dashboard available for error distribution visualization.
