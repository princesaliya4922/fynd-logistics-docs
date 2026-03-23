---
title: "ADR-003: Documentation Platform"
sidebar_position: 3
---

# ADR-003: Documentation Platform Choice

> **Status:** Accepted
> **Owner:** Engineering — Fynd Extensions Team
> **Date:** 2026-03-23
> **Last Updated:** 2026-03-23

---

## Context

The Fynd Shopify Ecosystem lacked a unified developer documentation site. New engineers had to piece together knowledge from code, Slack, and scattered Notion pages.

## Decision

Use **Docusaurus** (React-based static site generator) deployed on **Vercel** to host documentation in a dedicated `fynd-docs` repository.

## Structure

- `docs/` — Markdown source files (single source of truth)
- `website/` — Docusaurus app that reads `../docs`
- `vercel.json` — Mode A build config (repo root as build context)

## Rationale

### Docusaurus

- Purpose-built for developer documentation
- Built-in: sidebar navigation, search, versioning, dark mode, MDX support
- Mermaid diagram support (needed for architecture diagrams)
- Fast build times via React static generation
- Widely used in open-source and enterprise contexts
- Strong community and Shopify/Meta backing

### Vercel

- Zero-config deploy from git push
- Preview deployments per PR
- CDN distribution globally
- Free tier sufficient for internal docs

### Separate `fynd-docs` Repo

- Keeps docs independent from any single service
- Docs contributors don't need access to production code repos
- Docs PRs reviewed separately from code PRs
- Single deploy pipeline for all documentation

## Consequences

**Positive:**
- Searchable, navigable documentation site
- Mermaid diagrams for architecture visualization
- PR-based docs review process
- Single source of truth for all three projects

**Negative:**
- Docs site separate from code — risk of falling out of sync
- Requires maintaining a separate repo
- Engineers must remember to update docs when changing code

## Mitigation

- PR template in code repos includes "Did you update the docs?" checkbox
- Docs have `Last Updated` dates to surface staleness
- Known gaps tracked in [Quality → Known Gaps](../07-quality/known-gaps.md)
