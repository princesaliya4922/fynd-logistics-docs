---
title: Glossary
sidebar_position: 3
---

# Glossary

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

Key terms used throughout these docs.

---

## Fynd Platform Terms

| Term | Definition |
|------|-----------|
| **Fynd** | Reliance Retail's omnichannel commerce platform. Operates one of India's largest fulfillment networks. |
| **FLP** | **Fynd Logistics Platform** — the internal platform that creates and tracks shipments, assigns delivery partners, and manages the physical logistics workflow. |
| **OMS** | **Order Management System** — Fynd's order orchestration engine. Used as an alternative to FLP for some merchants (`fulfillment_engine: oms`). |
| **Fynd Central** | Fynd's core platform API — handles company registration, user management, sales channels, and subscriptions. |
| **FDK** | **Fynd Developer Kit** — Fynd's official SDK (`fdk-extension-javascript`, `fdk-client-javascript`) used to interact with the Fynd Platform API. |
| **FDK Extension** | A Fynd-registered extension that can be installed by companies on the Fynd platform. The shopify-backend acts as a Fynd extension. |
| **Company** | A merchant entity on the Fynd platform. A Shopify store must be linked to a Fynd Company to use logistics features. |
| **Sales Channel** | A channel within a Fynd Company (equivalent to a storefront/app). Used to route orders. |
| **Product Account** | A Fynd billing entity tied to a company for subscription management. |
| **Delivery Partner (DP)** | A courier company (e.g., BlueDart, Delhivery) configured on the Fynd platform to handle physical delivery. |
| **Courier Partner** | A courier partner definition in the backend's MongoDB — stores scheme_id, extension_id, and default cheapest flag. |
| **FLP Channel** | A channel created within FLP for a specific company+application combination. Required before creating shipments. |
| **AWB** | **Airway Bill** — a unique tracking number assigned to a shipment by the delivery partner. |
| **Serviceability** | Whether a specific pincode can be served by a merchant's warehouse(s). Determined by Fynd's serviceability API. |
| **Promise** | A delivery date window shown to customers (e.g., "Delivery by Mon–Wed"). Calculated based on pincode serviceability + merchant processing time. |

---

## Shopify Platform Terms

| Term | Definition |
|------|-----------|
| **Shopify Admin** | The web interface where merchants manage their stores. Embedded apps run inside this interface. |
| **Shopify Partner** | A developer/company with a Shopify Partner account, used to create and manage Shopify apps. |
| **Shopify CLI** | Command-line tool used to develop, build, and deploy Shopify apps and extensions. |
| **App Bridge** | Shopify's JavaScript SDK that enables embedded apps to communicate with the Shopify Admin. |
| **Polaris** | Shopify's React UI component library used to build consistent, native-looking admin interfaces. |
| **Checkout UI Extension** | A Shopify extension that renders custom UI inside the checkout flow. Used by Fynd Promise to show pincode checker at checkout. |
| **Theme Extension** | A Shopify extension that adds Liquid/JavaScript blocks to a merchant's storefront theme. Used by Fynd Promise on PDP. |
| **Admin UI Extension** | A Shopify extension that adds UI blocks to Shopify Admin pages (e.g., order details). Used by Fynd Logistics. |
| **PDP** | **Product Detail Page** — the storefront page for a specific product where customers add items to cart. |
| **OAuth** | The authentication flow used when a merchant installs a Shopify app. Grants the app an access token. |
| **HMAC** | **Hash-based Message Authentication Code** — used by Shopify to sign webhook payloads so the receiver can verify authenticity. |
| **Session Token** | A short-lived JWT issued by Shopify App Bridge that embedded apps use to authenticate backend requests. |
| **Embedded App** | A Shopify app rendered inside an iframe within the Shopify Admin. Both Fynd apps are embedded. |
| **Fulfillment Order** | A Shopify object representing a group of line items to be fulfilled from a specific location. |
| **Usage Record** | A billing event created via Shopify's API to charge a merchant for usage-based billing (e.g., per order). |
| **Billing Plan** | A Shopify subscription plan that defines pricing terms. Can be recurring or usage-based. |

---

## Project-Specific Terms

| Term | Definition |
|------|-----------|
| **Pincode** | A 6-digit Indian postal code. Used to determine delivery serviceability and estimate delivery dates. |
| **Promise Range** | The delivery date window shown to customers (e.g., 2–4 business days). Configurable per merchant. |
| **Processing Time** | The time a merchant needs to prepare an order before handing it to a courier. Configured in the logistics app setup. |
| **DeliveryPreference** | MongoDB field on `stores` collection. The merchant's preferred promise display mode. |
| **PromiseView** | How the delivery promise is displayed — e.g., range vs. fixed date. |
| **RegionHandle** | React component in both frontend apps that gates access to India-only merchants. |
| **UserHandle** | React component that orchestrates the main app flow after region check. |
| **FIK** | **Fynd Infrastructure Kit** — Fynd's internal Kubernetes deployment framework. Used to deploy all apps via Helm-like YAML configs. |
| **Zenith** | Fynd's internal data pipeline framework. Used to sync MongoDB collections to BigQuery. |
| **Boltic** | The pipeline orchestrator/scheduler used by Zenith for data sync jobs. |
| **DLQ** | **Dead Letter Queue** — holds failed transformation records for debugging. |
| **SIT** | **System Integration Testing** environment. Also called `fyndz0`. |
| **UAT** | **User Acceptance Testing** environment. Also called `fyndz5`. |
| **Link Existing** | The flow where a merchant links their existing Fynd account to their Shopify store via email OTP (Logistics app). |
| **Create New** | The flow where a merchant creates a brand new Fynd company account during setup (Logistics app). |
| **Jotai** | Atomic state management library used in the Logistics app frontend. |
| **Convict** | Node.js configuration validation library used in all three backends for type-safe env var management. |
