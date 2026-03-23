---
title: Authentication
sidebar_position: 5
---

# Authentication

> **Owner:** Engineering — Fynd Extensions Team
> **Status:** Approved
> **Last Updated:** 2026-03-23

The Fynd Shopify Ecosystem uses multiple authentication mechanisms for different scenarios.

---

## 1. Shopify OAuth (App Installation)

Used when a merchant installs either app.

### Flow

```
1. Merchant clicks "Add app" in Shopify App Store
         ↓
2. Shopify redirects to app's /api/auth
   (with shop domain as query param)
         ↓
3. App redirects merchant to Shopify OAuth consent screen
   (scopes requested: read_orders, write_fulfillments, etc.)
         ↓
4. Merchant approves → Shopify redirects to /api/auth/callback
   with authorization code
         ↓
5. App exchanges code for access token
   (via @shopify/shopify-app-express)
         ↓
6. Access token stored in:
   - SQLite (Promise app) or Redis (Logistics app)
         ↓
7. fyndIntegration.js fires:
   - Registers store with shopify-backend
   - Creates webhooks
         ↓
8. User redirected to app dashboard in Shopify Admin
```

### Session Storage

| App | Storage | Library | Session Key |
|-----|---------|---------|-------------|
| Promise | SQLite file (`database.sqlite`) | `@shopify/shopify-app-session-storage-sqlite` | Auto-managed |
| Logistics | Redis | `@shopify/shopify-app-session-storage-redis` | `shopify_logistics_session_*` |

On **app uninstall**, Logistics app webhook handler deletes all Redis sessions for that shop.

---

## 2. Session Token Auth (Frontend → Backend API calls)

Used when the React frontend makes API calls to `shopify-backend`.

### Flow

```
React component needs to call /api/endpoint
         ↓
useAuthenticatedFetch() / useLogisticsApi() hook:
  1. Calls getSessionToken() from @shopify/app-bridge
     → Returns a short-lived JWT (valid ~60s)
         ↓
  2. Attaches to request:
     Authorization: Bearer <shopify_session_jwt>
         ↓
shopify-backend receives request
  1. shopifySessionAuth middleware extracts Bearer token
  2. Decodes JWT (signed by Shopify using app's API secret)
  3. Extracts:
     - dest: "https://store-name.myshopify.com" (shop domain)
     - aud: "api_key_here" (which app made the request)
  4. Validates aud matches configured API key
  5. Looks up store in MongoDB by shop domain
  6. Attaches req.shop, req.store to request
         ↓
Controller has access to shop identity
```

### Token Refresh

- Session tokens expire every ~60 seconds
- If backend returns 401, `useLogisticsApi` hook automatically:
  1. Calls `getSessionToken()` for a fresh token
  2. Retries the original request once
  3. If still 401, throws error

### Two App Instances

The backend uses a **factory function** `createSessionAuth(appType)` to create app-specific middleware:

```javascript
// For logistics app endpoints
const shopifyLogisticsSessionAuth = createSessionAuth('logistics')
// Verifies against shopify_app.logistics_api_key + logistics_api_secret

// For promise app endpoints
const shopifyPromiseSessionAuth = createSessionAuth('promise')
// Verifies against shopify_app.promise_api_key + promise_api_secret
```

---

## 3. Shopify Webhook HMAC Verification

Used when Shopify sends webhook events to `shopify-backend`.

### Flow

```
Shopify fires POST /webhook/store/:shop/:topic
         ↓
shopifyHmacAuth middleware:
  1. Reads X-Shopify-Hmac-Sha256 header
  2. Reads raw request body (captured before JSON parsing)
  3. Determines which app secret to use:
     - ?app=logistics → shopify_app.logistics_api_secret
     - ?app=promise  → shopify_app.promise_api_secret
  4. Computes HMAC-SHA256 of raw body using the app secret
  5. Timing-safe comparison (prevents timing attacks):
     crypto.timingSafeEqual(computed, received)
  6. If mismatch → 401 Unauthorized
  7. If match → passes to controller
```

> **Why timing-safe?** A naive `===` comparison leaks timing information — an attacker can determine how many bytes match by measuring response time. `timingSafeEqual` takes constant time regardless of match length.

---

## 4. Basic Auth (Internal/Admin APIs)

Used for internal admin APIs and certain data management endpoints.

```javascript
// basicAuth.js
Authorization: Basic base64(username:password)
```

Credentials configured via:
- `BOLTIC_USERNAME` + `BOLTIC_PASSWORD` (admin routes)

Routes protected:
- `/logistics/admin/*` — Admin dashboard APIs
- `/logistics/admin/api/promise/*` — Promise admin APIs
- `/map/mapInventories` — Inventory mapping
- `/webhook/extension/status` — Extension status webhooks

---

## 5. OTP Verification (Account Linking)

Used in the Logistics app to link a Shopify store to an existing Fynd company account.

### Flow

```
Merchant enters company email address
         ↓
POST /logistics/otp/send
  → shopify-backend calls Fynd Central:
    POST /service/integration/auth/v1.0/users
    with email → triggers OTP email
         ↓
Merchant receives OTP (6 digits) in email
         ↓
POST /logistics/otp/verify
  → shopify-backend calls Fynd Central:
    verify OTP → returns company list
         ↓
Merchant selects company (dropdown)
         ↓
Account linking complete → proceeds to full setup
```

OTP constants (in `web/frontend/constants.js`):
- `OTP_LENGTH = 6`
- `RESEND_TIMER_DURATION = 10` (seconds before resend allowed)

---

## 6. Fynd Extension API Authentication

When the backend calls Fynd platform APIs (FLP, Fynd Central), it authenticates using:

```javascript
// HTTP headers on all Fynd API calls:
{
  'x-api-key': config.get('extension_api_key'),
  'x-api-secret': config.get('extension_api_secret'),
  // or
  'Authorization': `Bearer ${adminToken}`
}
```

Admin tokens are obtained via:
```
POST /service/panel/authentication/v1.0/admin/oauth/token
  with client_credentials grant
```

---

## Summary

| Mechanism | Used For | Verified By |
|-----------|----------|-------------|
| Shopify OAuth | App installation | `@shopify/shopify-app-express` |
| Session Token (JWT) | Frontend → backend API calls | `shopifySessionAuth` middleware |
| HMAC-SHA256 | Shopify webhook verification | `shopifyHmacAuth` middleware |
| Basic Auth | Admin APIs + internal routes | `basicAuth` middleware |
| Email OTP | Fynd account linking | Fynd Central API |
| API Key/Secret | Backend → Fynd API calls | Fynd platform validates |
