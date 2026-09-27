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
for reference. `/api/subscribe` is still in the codebase; see its own
section below for why.)

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

**Verified locally** (`localhost`, wrapping `window.omnisend.push` to
count real invocations, since the array's own length stops being a
useful signal once Omnisend's real script takes over — see that
component's own comment): exactly one push per client-side navigation,
correctly skipping the very first page load. **Not verifiable locally**:
whether the resulting event actually reaches Omnisend's backend —
`localhost` isn't a hostname registered to this brand ID, so Omnisend's
own settings fetch gets CORS-rejected on load, which appears to hold back
real event reporting regardless of how correctly this code calls `push`.
Worth a quick real-network-tab check once this is live on the actual
domain.

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

### `/api/subscribe` — kept, but not currently used by anything

`src/app/api/subscribe/route.ts` (POST an email → subscribes an Omnisend
Contact, tagged `website-popup`) is left in the codebase even though the
popup that originally called it (`EmailSignupPopup.tsx`) is deleted — see
that route's own top comment. It's a plausible endpoint for a future
on-site form (a footer signup field, for instance) that isn't the
dashboard-hosted popup above and so does need a plain subscribe API. If
that never materializes, this route (and its `OMNISEND_API_KEY` env var)
can be deleted too.

Nothing currently posts to it, so nothing currently depends on
`OMNISEND_API_KEY` being set — only `NEXT_PUBLIC_OMNISEND_BRAND_ID`
(above) is required for the live popup/tracking to work.

### Superseded: "no tracking script" note

An earlier version of this doc said Omnisend's on-site tracking script
was deliberately not installed. That's no longer true — the snippet
above *is* that script, loaded on purpose specifically so the hosted
popup can run. Left this note here only so anyone who remembers the old
guidance doesn't act on it.
