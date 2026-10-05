# Third-Party Integrations

Where each external service is wired in, and — for anything that needs
setup outside this codebase — what that setup is. See also `.env.example`
for the actual env vars each of these reads.

## Omnisend — on-site popup + tracking

The "Get 10% Off" signup experience is no longer custom code — it's
Omnisend's own **hosted on-site popup** ("Email & SMS branded multi-step
welcome discount" form type, as of this writing), rendered and controlled
entirely by Omnisend's tracking snippet. This codebase's only job is
loading that snippet on every page; the popup's design, copy, timing,
targeting/audience rules, and the discount itself are all configured in
the **Omnisend dashboard**, not here.

(This replaces an earlier custom `EmailSignupPopup.tsx` + `/api/subscribe`
Contacts-API integration — see git history if you need the old approach
for reference. `/api/subscribe` was deleted 2026-09-28 as genuinely dead
code, see "Deleted" below.)

### The snippet

`src/components/analytics/OmnisendSnippet.tsx`, mounted once in the root
layout (`src/app/layout.tsx`) via `next/script` with
`strategy="afterInteractive"`. Loaded by hand rather than through
Omnisend's usual Shopify theme App Embed, because this frontend is
headless — there's no theme for the app to embed into.

- Reads the brand ID from `NEXT_PUBLIC_OMNISEND_BRAND_ID` (see
  `.env.example`) instead of hardcoding it. If that env var is unset, the
  component skips loading the snippet entirely (a dev-only
  `console.warn`, no error) — **the popup and all Omnisend tracking
  silently don't run** until it's set. The rest of the site is
  unaffected either way.
- **Required on every page** — this is a root-layout mount, not a
  per-page one, so it already loads everywhere by construction. Don't
  move it into a specific page/route without replacing it with something
  equivalent; Omnisend's popup and any dashboard-side targeting rules
  (e.g. "show on 3rd pageview," "show on exit intent") depend on the
  snippet having been present on every page the visitor touched, not
  just the one it happens to trigger on.
- Loads further Omnisend assets at runtime — confirmed by hand (browser
  devtools → Network, on this component once wired up):
  `script-src` needs **`omnisnippet1.com`** (the launcher script itself,
  plus its own `monitoring.js`), and `connect-src` needs
  **`wt.omnisendlink.com`** (a `getSettings` fetch the launcher makes on
  load). No Content-Security-Policy exists in this codebase as of this
  writing, so there's nothing to allow-list today — **if a CSP is ever
  added**, both domains above need to go in, and it's worth re-checking
  the Network tab again at that point in case Omnisend's launcher has
  started pulling in anything else since.

### Route-change tracking (`$pageViewed`)

The snippet fires Omnisend's `$pageViewed` track call exactly once, on
the real page load it's injected into. This is an App Router SPA — every
navigation after that first load is client-side (no new document, the
snippet doesn't re-run) — so without extra handling, Omnisend would only
ever see a visitor's very first page for the entire session.

`src/components/analytics/OmnisendPageView.tsx` (mounted alongside the
snippet in the root layout, inside a `<Suspense>` boundary since it uses
`useSearchParams`) watches for pathname/search-param changes and re-pushes
`omnisend.push(["track", "$pageViewed"])` itself on every navigation after
the first, guarded on `window.omnisend` actually existing (it won't if
the brand ID is unset, or briefly, before the async snippet finishes
initializing).

**Verified** (both `localhost` and the live `*.vercel.app` Preview
deploy, wrapping `window.omnisend.push` to count real invocations, since
the array's own length stops being a useful signal once Omnisend's real
script takes over — see that component's own comment): exactly one push
per client-side navigation, correctly skipping the very first page load.

**Confirmed broken as of 2026-09-28, not just a local-dev caveat**: the
Preview deploy (`tom-foolery-chocolate.vercel.app`) throws an uncaught
"Failed to fetch" on every single page load — Omnisend's own settings
fetch (`wt.omnisendlink.com/REST/inShop/v1/getSettings`) CORS-rejects the
`*.vercel.app` hostname as unrecognized for this brand ID, the same way
it does `localhost`. This isn't just theoretical "might hold back
reporting" — it's a live, reproducible error on the one hostname this app
has actually been deployed to so far. **Action needed**: once the real
production domain (`NEXT_PUBLIC_SITE_URL`) is registered with this brand
ID in the Omnisend dashboard and actually serving traffic, re-check the
Network tab there — don't assume it's fixed just because the domain
changed.

### Setup checklist (Omnisend dashboard side)

Everything here is dashboard configuration, not a code change:

1. **Store settings** → confirm/find your brand ID → put it in
   `NEXT_PUBLIC_OMNISEND_BRAND_ID` (see `.env.example`, and Vercel →
   Project Settings → Environment Variables for Production + Preview).
2. Build (or confirm) the on-site popup itself — the branded multi-step
   welcome-discount form — including its design, its trigger/timing
   rules, and its audience/targeting filters.
3. **Automations** → the Welcome automation that actually sends the
   discount code needs to be **enabled and published** (a built-but-
   unpublished or paused automation silently never sends anything — the
   popup will still happily collect signups either way, so this fails
   silently from a visitor's point of view too).
4. Check that automation's trigger filter is scoped to **first-time
   subscribers only** (Omnisend's own "runs once per contact" /
   first-subscription-style filter, exact wording depends on the
   automation editor version) — not just "contact subscribed," which
   would re-fire the welcome email for someone who's already a
   subscriber and happens to re-trigger the popup's subscribe event
   again later (re-visiting, resubmitting, etc.).
5. Nothing else on the codebase side needs to change once the snippet
   (above) is loading — the popup, its targeting, and the automation are
   entirely dashboard-managed from here on.

### Newsletter footer link — custom-trigger form (optional)

The footer's "Newsletter" link (`src/components/layout/
NewsletterTriggerButton.tsx`) opens a *separate* Omnisend form on demand,
via Omnisend's documented custom-trigger API
(`omnisend.push(["openForm", formId])` —
https://support.omnisend.com/en/articles/10002471-set-up-custom-triggers-for-popup-flyout-forms),
rather than relying on the dashboard popup's own automatic trigger (time
delay, exit intent, etc.). Requires:

1. A form in the Omnisend dashboard explicitly set to **Custom Trigger**
   display mode (Behavior Settings → Display).
2. Its form ID in `NEXT_PUBLIC_OMNISEND_NEWSLETTER_FORM_ID` (see
   `.env.example`).

Without that env var set, the Newsletter link doesn't render at all
(rather than shipping a link with nothing to open) — this is optional,
not required for the dashboard popup above to keep working.

### Deleted: `/api/subscribe`

`src/app/api/subscribe/route.ts` (POST an email → subscribe an Omnisend
Contact, tagged `website-popup`) was removed 2026-09-28. It was built for
the original custom `EmailSignupPopup.tsx`, which was already deleted
when this codebase moved to Omnisend's hosted popup (above); nothing had
called this route since. If a future on-site form genuinely needs a plain
subscribe endpoint again, see git history for the old implementation
(Omnisend Contacts API, `OMNISEND_API_KEY`) rather than reinventing it.

### Superseded: "no tracking script" note

An earlier version of this doc said Omnisend's on-site tracking script
was deliberately not installed. That's no longer true — the snippet
above *is* that script, loaded on purpose specifically so the hosted
popup can run. Left this note here only so anyone who remembers the old
guidance doesn't act on it.

## Resend — contact form + gifting inquiry email

Powers both forms on the site: `/contact` (`src/app/api/contact/route.ts`)
and `/gifting` (`src/app/api/gifting/route.ts`). Both are thin fetch calls
to Resend's API (`src/lib/resend/client.ts` — no SDK dependency) and share
their validation, honeypot, rate-limiting, and to/from-address resolution
via `src/lib/forms/` (`shared.ts`, `email-config.ts`) rather than
duplicating that logic between the two routes.

### Required env vars

`RESEND_API_KEY`, plus a `_TO_EMAIL`/`_FROM_EMAIL` pair per form
(`CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL`, `GIFTING_TO_EMAIL`/
`GIFTING_FROM_EMAIL`) — see `.env.example` for the full setup checklist
(domain verification, etc.).

**Production vs. everywhere else** (`src/lib/forms/email-config.ts`,
`resolveFormEmail`): in a genuine production deploy
(`isProductionRuntime()`, `src/lib/env.ts`), all of the above must be real
env vars — a missing one returns a friendly 503 to the visitor and logs a
loud server error, never a silent fallback to a personal inbox or the
unverified sandbox sender. Outside production (local dev, Vercel
Preview), a missing `_TO_EMAIL`/`_FROM_EMAIL` pair falls back to a
clearly-labeled dev sender/recipient so the forms still work without
secrets configured; a missing `RESEND_API_KEY` in *any* environment
returns the same "not set up yet" message it always has
(`isResendConfigured()`, checked before address resolution).

### Domain verification status

As of 2026-10-04, **done**: `tomfoolerychocolate.com`'s DNS (at
Namecheap) carries `resend._domainkey` (DKIM TXT) plus the `send` and
`rsend` CNAMEs Resend's domain verification asked for (both →
`*.forge.rmta.net`). Confirmed via `dig` against the authoritative
nameserver during the 2026-10-04 domain cutover (see "Domain & DNS" below)
— see that section for the exact record values. Both forms send from
real `@tomfoolerychocolate.com` addresses in production now, not the
shared Resend sandbox sender.

### Honeypot + rate limiting

Both forms have a hidden `website` field (a real visitor never sees or
fills it — `ContactForm.tsx`/`GiftingForm.tsx`) and an in-memory,
per-route rate limit (5 submissions per 10 minutes per IP,
`createRateLimiter` in `src/lib/forms/shared.ts`). The limiter is
module-scoped and resets on every cold start, and isn't shared across
concurrent serverless instances — a rough abuse deterrent, not a durable
limit under real load. Move to Upstash/Vercel KV (or similar shared
store) before this needs to actually hold up.

## Shopify — storefront, cart, and shop policies

Headless Storefront API integration — `src/lib/shopify/client.ts` (auth,
fetch wrapper), `src/lib/shopify/queries.ts` (every query/mutation),
`src/lib/shopify/mock-data.ts` (fallback backend, see that file's own
top comment for exactly when it's used).

### Required env vars

`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_-
PUBLIC_TOKEN` (both — `isShopifyConfigured()`), and
`SHOPIFY_STOREFRONT_PRIVATE_TOKEN` for privileged mutations
(`customerCreate`). See `.env.example`.

### Unconfigured vs. a real failure

Two different fallback rules, both keyed on `isProductionRuntime()`
(`src/lib/env.ts`):

- **Missing env vars** (`!isShopifyConfigured()`): outside production,
  falls back to `mock-data.ts` so the whole site — including checkout —
  works with zero Shopify credentials. In production, throws instead
  (`unconfiguredFallback`, `queries.ts`) rather than silently showing a
  real customer fake demo products and a non-functional cart.
- **A real API call fails** (network error, bad token, malformed
  response): outside production, also falls back to mock data
  (`handleReadFailure`). In production, rethrows — ISR already keeps
  serving the last-good static output on a revalidation failure, so this
  only actually surfaces for a genuine first-ever render with nothing to
  fall back to.

### Featured collection

`getFeaturedProducts()` reads a collection handled `featured`
(`FEATURED_COLLECTION_HANDLE`, `queries.ts`) — **this collection doesn't
exist yet** in the Shopify admin as of this writing. An empty/missing
collection isn't treated as a failure (it's a legitimate, if incomplete,
Shopify state), so the homepage rail falls back to mock products in the
meantime, in every environment including production. Create the
collection in Shopify admin to replace that fallback — no code change
needed once it exists.

### Shop policies (`getShopPolicies`)

Powers `/privacy`, `/returns`, `/shipping`, `/terms` (each fetches via
`shop { privacyPolicy refundPolicy shippingPolicy termsOfService }`).
Each page 404s on its own if its policy is empty, rather than rendering a
blank page — same "empty is legitimate, not a failure" treatment as the
featured collection above.

**Current state in the Shopify admin (checked 2026-09-28)**: only
`privacyPolicy` is filled in. `refundPolicy`, `shippingPolicy`, and
`termsOfService` are all empty, so `/returns`, `/shipping`, and `/terms`
currently 404. Fill each in under Shopify admin → Settings → Policies to
bring the corresponding route live — no code change needed.

### Selling plans

`npm run check-selling-plans` (`scripts/check-selling-plans.ts`) audits
every product for Shopify's `requiresSellingPlan` flag (subscription-only
purchase) — run it after adding or editing products, so a
subscription-only product doesn't show up unexpectedly in
`ProductDetail.tsx`'s purchase-options UI.

## Domain & DNS — tomfoolerychocolate.com

**2026-10-04: live cutover from the old Shopify theme to this app.**
`tomfoolerychocolate.com` and `www.tomfoolerychocolate.com` now point at
Vercel; Shopify keeps only `checkout.tomfoolerychocolate.com` (for cart/
checkout — this app's `cart.checkoutUrl` comes straight from the
Storefront API's `Cart` object, so it automatically uses whatever domain
Shopify is configured to issue checkout URLs from) and the underlying
`*.myshopify.com` domain. DNS is still hosted at Namecheap throughout —
nameservers were **not** delegated to Vercel; Vercel's dashboard defaults
to suggesting nameserver delegation, but the records below (added via
Vercel's "DNS Records" tab, not its "Vercel DNS" tab) keep Namecheap
authoritative, which is what every other record on this domain (email,
checkout) depends on.

### Current records (Namecheap → Advanced DNS → Host Records)

| Host | Type | Value | Purpose |
| --- | --- | --- | --- |
| `@` | A | `216.198.79.1` | Vercel apex (Production) |
| `www` | CNAME | `ff0569313a6e9c39.vercel-dns-017.com` | Vercel; 308 redirects to apex |
| `checkout` | CNAME | `shops.myshopify.com` | Shopify Primary domain — cart/checkout only |
| `send` | CNAME | `send.forge.rmta.net` | Resend domain verification |
| `rsend` | CNAME | `rsend.forge.rmta.net` | Resend domain verification |
| `resend._domainkey` | TXT | (DKIM public key) | Resend DKIM |
| `@` | TXT | `v=spf1 include:_spf.google.com ~all` | SPF — exactly one record; adding a second breaks SPF |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:garrett@tomfoolerychocolate.com` | DMARC, monitoring mode |
| `@` | MX | `1 smtp.google.com` | Google Workspace mail |

### Rollback (only if something's actually broken — ask before reverting)

Restores the pre-cutover state, Shopify theme serving the apex again:

1. Namecheap: change `@` A → `23.227.38.65`; change `www` CNAME →
   `shops.myshopify.com`.
2. Shopify → Settings → Domains: re-add `tomfoolerychocolate.com` and
   `www.tomfoolerychocolate.com`, reconnect, set the apex back to
   Primary.
3. Leave `checkout.tomfoolerychocolate.com` and all email records alone
   either way — neither one changes between the live and rolled-back
   states.

### Old-theme redirect script (Shopify `theme.liquid`)

A snippet in the old Shopify theme's `layout/theme.liquid` redirects any
remaining traffic that still lands on a Shopify-served page (crawler
cache, old bookmark, external backlink, etc. — anything that resolves
through `checkout.tomfoolerychocolate.com` or a cached `*.myshopify.com`
URL rather than the real apex) over to the matching page on this app.

**⚠️ Fragile by nature**: this lives in the Shopify theme, not this repo.
A theme update (including a Shopify-pushed Horizon/base-theme update) or
switching themes removes it silently — nothing here will catch that.
Check it's still present after any theme change.

```liquid
<!-- TODO: paste the actual script from theme.liquid here -->
```

*(Placeholder — the script above needs to be pasted in from Shopify
admin → Online Store → Themes → Edit code → `layout/theme.liquid`. This
doc isn't accurate until that's filled in.)*

### Old-URL → new-URL redirect mapping (`next.config.ts`)

`next.config.ts`'s `redirects()` covers the old theme's URL patterns,
cross-checked against the old theme's own sitemap (still reachable at
`checkout.tomfoolerychocolate.com/sitemap*.xml` post-cutover, since that
subdomain stays on Shopify):

- `/products/:handle*` → `/shop/:handle*`
- `/pages/contact` → `/contact`
- `/pages/frequently-asked-questions` → `/faq`
- `/collections/*` needs **no redirect** — this app already serves that
  same path structure (`/collections/[handle]`), confirmed against every
  handle in the old sitemap (`frontpage`, `chocolate-bars`, `bon-bons`,
  `featured`, `gifts`).

**Three old URLs have no equivalent page on this app yet — not
redirected, pending a content decision:**

- `/pages/data-sharing-opt-out` — CCPA/privacy-choices page. This app has
  no opt-out/do-not-sell mechanism built yet; redirecting it to `/privacy`
  would be misleading (that page doesn't offer the same opt-out action).
- `/pages/free-chocolate-for-a-year-terms-conditions` — a specific past
  promo's terms, not the same thing as this app's general `/terms`.
- `/blogs/news` — this app has no blog section.

If any of these still get real traffic (check Search Console/analytics
for the old paths after launch), decide where each should point and add
it to `redirects()` — don't guess at the destination without checking
whether the old content needs to be preserved somewhere first.
