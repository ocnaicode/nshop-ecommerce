# LocalMart Marketplace Platform — Deployment Readiness Report

**Repository:** `ocnaicode/nshop-ecommerce`
**Commit verified:** `9375bd2` (tip of `main`, "Merge pull request #4 from ocnaicode/arena/019ffb46-nshop-ecommerce")
**Verified on:** 2026-08-15
**Environment:** Node v22.22.3, npm 10.9.8, Next.js 16.3.0 (Turbopack), React 19.2.8

---

## 1. Build verification

| Step | Command | Result |
|---|---|---|
| Install | `npm ci` | **PASS** — 539 packages, 0 vulnerabilities, ~18s |
| Production build | `npm run build` | **PASS** — exit code 0, compiled in ~27s |
| Type check | `npx tsc --noEmit` | **PASS** — exit code 0, no type errors |
| Production boot | `npx next start` | **PASS** — ready in 133ms |
| Lint | `npm run lint` | **FAIL** — exit code 1, 322 problems (145 errors, 177 warnings) |

`main` builds cleanly and reproducibly. 109 routes were generated with no build errors.

### Build warnings (non-blocking)

1. **Middleware deprecation** — Next.js 16 reports:
   `The "middleware" file convention is deprecated. Please use "proxy" instead.`
   `src/middleware.ts` still uses the old convention. It works today, but will break on a future
   major. Auto-migration: `npx @next/codemod@canary middleware-to-proxy .`
2. **`MONGODB_URI not set`** during static generation — expected and handled; `src/lib/db.ts`
   deliberately avoids throwing at build time.

### Lint failure detail

Lint is **not** part of `npm run build`, so this does **not** block a Vercel deploy. The errors are
code-quality issues, not correctness bugs — dominated by `@typescript-eslint/no-explicit-any`,
`prefer-const`, unused vars, and several `react-hooks/set-state-in-effect` findings (e.g.
`src/components/providers/auth-provider.tsx`). Worth burning down, but not a release gate.

---

## 2. Current state of `main`

### Scale
- **~150 source files** under `src/`
- **109 routes** total: **63 page routes** + **46 API route handlers**
- 96 statically prerendered (`○`), 13 dynamic (`ƒ`), plus middleware

### Structure
```
src/
  app/            App Router — (auth), (public), admin, seller, customer, rider, api
  components/     layout, dashboard, providers, shared, ui (shadcn-style primitives)
  config/         constants.ts (roles, auth config, pagination)
  lib/            auth.ts (jose JWT), db.ts (mongoose cache), i18n.ts, utils.ts
  models/         User, Seller, Shop, Product, Order, index.ts (aggregate models)
  services/       ai.service, loyalty.service, notification.service
  validators/     Zod schemas
  types/          shared TypeScript types
  middleware.ts   route protection
  tests/          auth.test.ts, utils.test.ts
```

### Feature areas (by route surface)
- **Public/storefront** — home, products, product detail, shops, shop detail, categories,
  directory + detail, offers, seller-info, about/contact/faq/privacy/terms
- **Auth** — login, register (JWT in httpOnly cookie `localmart_session`)
- **Customer** — dashboard, orders + detail, addresses, wishlist, messages, profile, cart, checkout
- **Seller** — dashboard, products (list/new/edit), orders + detail, inventory, purchases,
  suppliers, customers, staff, POS, wallet, insights, reviews, delivery, plans, settings, support
- **Admin** — dashboard, users, sellers, shops, products, orders, payments, commissions, plans,
  coupons, banners, disputes, reviews, riders, delivery, feature-flags, notifications, analytics,
  settings
- **Rider** — rider console + 5 rider APIs (available/current/delivery/history/status)
- **Platform** — SEO (`sitemap.ts`, `robots.ts`, `manifest.ts`), seed endpoint, chat, export

### Stack
Next.js 16 App Router · TypeScript · Tailwind CSS 4 · MongoDB/Mongoose 9 · `jose` JWT auth ·
Zod validation · Radix UI · Recharts · Framer Motion · Cloudinary (wired, optional)

---

## 3. Deploy readiness assessment

**Verdict: the build is deploy-ready; the configuration is not yet. Two items should be fixed
before a public production deploy.** For a private/staging deploy it can ship as-is.

### Blockers for a *public* production deploy

**B1 — `/api/seed` is unauthenticated and destructive.**
`src/app/api/seed/route.ts` has no auth guard, no `NODE_ENV` check, and no shared-secret check.
Its first action is `deleteMany({})` across 13 collections (User, Seller, Shop, Product, Category,
Order-adjacent, plans, coupons, flags, config, riders). Anyone who sends
`POST https://your-domain/api/seed` **wipes the production database** and reseeds it. The response
body also returns demo credentials in plaintext. The `/seed` page is publicly reachable too (it
returned HTTP 200 in the smoke test).
*Fix:* gate on a `SEED_SECRET` header, refuse when `NODE_ENV === 'production'`, or delete both the
route and `/seed` page before going public.

**B2 — Auth secret silently falls back to a hardcoded value.**
`src/config/constants.ts:9` → `process.env.AUTH_SECRET || 'fallback-secret-change-me'`.
If `AUTH_SECRET` is ever missing in the Vercel environment, the app boots normally and signs
session JWTs with a public, source-visible string — anyone could forge an admin session. This
fails open rather than closed.
*Fix:* throw on startup when `AUTH_SECRET` is unset in production, and set a strong value in Vercel.

### Non-blocking issues
- **Lint fails** (145 errors) — cosmetic/quality; not in the build path.
- **`middleware.ts` deprecated** in Next 16 — migrate to `proxy`.
- **No `vercel.json`** — fine, Vercel auto-detects Next.js. Only needed for regions/crons.
- **No `engines` field** in `package.json` — Vercel picks its default Node (22.x). Pin if you care.
- **Middleware checks cookie presence only**, not signature validity — real authorization is
  enforced server-side in the API handlers (verified: `/api/admin/users` correctly checks
  `getSession()` + `isAdmin()`, and `/api/auth/me` returned 401 unauthenticated). Acceptable
  pattern, but middleware alone is not a security boundary.
- **`.env` hygiene is good** — only `.env.example` is committed; `.env*.local` is gitignored.

### What was NOT verified
Runtime behavior against a live database could not be exercised — the sandbox has no MongoDB and
cannot reach the MongoDB binary CDN. Confirmed: all DB-backed API routes return HTTP 500 with no
`MONGODB_URI` (graceful JSON errors, no crash), static pages render fine (`/`, `/products`,
`/shops`, `/login`, `/register`, `/about`, `/directory` all HTTP 200). **Data-path correctness,
auth login flow, checkout, and POS remain untested end-to-end** and should be smoke-tested against
a real Atlas cluster on a preview deployment before you call it production-good.

---

## 4. Deployment instructions (Vercel)

### Step 1 — Provision MongoDB Atlas
1. Create a cluster at https://cloud.mongodb.com (free M0 works for staging).
2. **Database Access** → add a user with a strong password.
3. **Network Access** → allow `0.0.0.0/0` (Vercel serverless has no static egress IPs), or use
   Vercel's dedicated-IP add-on / Atlas Private Endpoint for tighter control.
4. Copy the connection string:
   `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/localmart?retryWrites=true&w=majority`

### Step 2 — Generate an auth secret
```bash
openssl rand -base64 32
```

### Step 3 — Import the project
1. https://vercel.com/new → import `ocnaicode/nshop-ecommerce`
2. Framework preset: **Next.js** (auto-detected)
3. Build command `npm run build`, install `npm ci`, output auto — leave defaults
4. Production branch: `main`

### Step 4 — Environment variables
Set in **Project → Settings → Environment Variables** (Production + Preview).

Required:
```
MONGODB_URI            mongodb+srv://...  (from step 1)
MONGODB_DB_NAME        localmart
AUTH_SECRET            <output of step 2>
NEXT_PUBLIC_APP_URL    https://your-domain.vercel.app
```
Recommended:
```
NEXT_PUBLIC_APP_NAME          LocalMart
NEXT_PUBLIC_APP_DESCRIPTION   All local shops in one place
AUTH_TOKEN_EXPIRY             7d
AUTH_REFRESH_TOKEN_EXPIRY     30d
DEMO_MODE                     false
```
Feature flags (DB config overrides these):
```
ENABLE_COD=true  ENABLE_BKASH=false  ENABLE_NAGAD=false  ENABLE_AI=false
ENABLE_PLATFORM_DELIVERY=true  ENABLE_SELLER_DELIVERY=true  ENABLE_SELF_PICKUP=true
```
Optional, only if you use the integration — image uploads, payments, SMS/email, and AI features
degrade gracefully when unset:
```
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET / NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
BKASH_* , NAGAD_* , SMS_* , SMTP_* , AI_PROVIDER / AI_API_KEY / AI_MODEL , MAPS_*
```
Note `NODE_ENV` is set by Vercel automatically — do not set it yourself.

### Step 5 — Deploy and seed
1. Click **Deploy**; first build takes ~1-2 minutes.
2. Seed the database **once**:
   - Preferred (local, keeps the endpoint closed):
     `MONGODB_URI="<atlas-uri>" npm run seed`
   - Or `POST https://your-domain/api/seed` — then **immediately** remove or gate the endpoint (B1).
3. Demo credentials created by the seed:
   - Admin `admin@localmart.com` / `Admin123!`
   - Seller `rahim.store@localmart.com` / `Seller123!`
   - Customer `+8801700000001` / `Customer123!`
   - Rider `+8801700000099` / `Rider123!`
   **Change every one of these before exposing the site publicly.**

### Step 6 — Post-deploy checks
- Load `/`, `/products`, `/shops` — verify seeded data renders.
- Log in as admin → `/admin`; as seller → `/seller`; confirm the dashboards populate.
- Place a test order through `/cart` → `/checkout`.
- Confirm `/api/seed` is unreachable or secret-gated.
- Confirm `/sitemap.xml` and `/robots.txt` resolve.

### Custom domain
**Settings → Domains** → add domain → follow DNS instructions → then update `NEXT_PUBLIC_APP_URL`
to the final domain and redeploy.

---

## Summary

`npm ci && npm run build` both succeed cleanly on `main` at `9375bd2`, TypeScript is error-free,
and the production server boots and serves pages. The 109-route marketplace (customer, seller,
admin, and rider surfaces) is functionally complete on paper. Ship it to a preview deployment now;
before pointing a public domain at it, close the unauthenticated `/api/seed` wipe endpoint and make
`AUTH_SECRET` fail closed, then run the step-6 smoke tests against real data.
