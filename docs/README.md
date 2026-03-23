---
title: Fynd Shopify Docs
sidebar_position: 0
---

# Fynd Shopify Documentation

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Active
> **Last Updated:** 2026-03-23

Welcome to the unified documentation for the **Fynd Shopify Ecosystem** — a suite of Shopify apps and a shared backend that enable Indian merchants to use Fynd's logistics and delivery-promise infrastructure directly from their Shopify stores.

## What's Documented Here

| Project | Purpose |
|---------|---------|
| **shopify-pincode-checker** | Shopify app for **Fynd Promise** — shows delivery date promises on product and checkout pages |
| **shopify-logistics-app** | Shopify app for **Fynd Logistics** — connects Shopify orders to Fynd's fulfillment network |
| **shopify-backend** | Shared Node.js/Express backend that powers both apps |

## How to Use These Docs

| If you want to… | Go to… |
|-----------------|--------|
| Understand what these apps do | [Overview → Introduction](./00-overview/introduction.md) |
| Set up locally for the first time | [Getting Started](./01-getting-started/prerequisites.md) |
| Understand how everything fits together | [Architecture → System Overview](./02-architecture/system-overview.md) |
| Look up an API endpoint | [Reference → Backend API](./03-reference/api-backend.md) |
| Follow a step-by-step guide | [How-To Guides](./04-how-to/install-promise-app.md) |
| Check deployments and environments | [Operations → Environments](./05-operations/environments.md) |
| Understand a design decision | [Decisions (ADRs)](./06-decisions/adr-001-sqlite-vs-redis.md) |
| Understand data pipelines to BigQuery | [Data Pipeline](./09-data-pipeline/overview.md) |

## Doc Governance

- All docs use lowercase `.md` filenames.
- Each doc has an `Owner`, `Status`, and `Last Updated` frontmatter.
- Raise a PR against `fynd-docs` to update docs.
- Known gaps and TODOs live in [Quality → Known Gaps](./07-quality/known-gaps.md).
