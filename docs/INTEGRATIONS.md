# Third-Party Integrations

Where each external service is wired in, and — for anything that needs
setup outside this codebase — what that setup is. See also `.env.example`
for the actual env vars each of these reads.

## Omnisend — email signup popup

`src/components/commerce/EmailSignupPopup.tsx` (the "Get 10% Off" popup,
shown once per session 1.5s after first mount — see that file's own
comment for the full suppression/timing behavior) posts to
`src/app/api/subscribe/route.ts`, which subscribes the visitor as an
Omnisend contact tagged `website-popup`.

### The 10%-off code is not generated or sent by this codebase

Neither the popup nor `/api/subscribe` ever creates, stores, or emails a
discount code. The code is delivered entirely on Omnisend's side, by a
**Welcome automation** configured to:

1. Trigger on: contact added with tag `website-popup`.
2. Send an email containing a Shopify discount code (a fixed code, or one
   generated per-send via Omnisend's Shopify integration — either works;
   which one is an Omnisend/Shopify setup decision, not a code change
   here).

If that automation is ever paused, edited, or the trigger tag changes,
subscribers still get subscribed successfully (this route doesn't know or
care whether an automation exists) — they just won't receive a code email
until the automation is fixed. That failure mode is silent from this
codebase's side, so it's worth spot-checking the automation directly in
Omnisend (Automations → the Welcome flow) if someone reports never
receiving their code.

### What `/api/subscribe` actually does

- Validates + normalizes the submitted email (trim, lowercase, length,
  regex — server-side, never trusting the client alone).
- Rejects silently (fake `200 { ok: true }`, no Omnisend call) if the
  hidden `website` honeypot field is filled — see the route and
  `EmailSignupPopup.tsx` for both halves of that.
- Rate-limits at 5 requests / 10 minutes per IP, in-memory (see the TODO
  in the route file — this resets per serverless instance and should
  move to a shared store like Upstash/Vercel KV before it needs to hold
  up under real load).
- On success, tells the client whether this was a brand-new contact
  (`existing: false`) or an already-subscribed one (`existing: true`) —
  `EmailSignupPopup.tsx` shows different copy for each, and gives an
  already-subscribed visitor a much longer popup-suppression window
  (365 days vs. 7 for a plain dismiss) since re-showing them the same
  offer is pure friction.

### Setup checklist (Omnisend side)

1. Omnisend dashboard → **Store settings → API keys** → create a key with
   **Contacts** write access → put it in `OMNISEND_API_KEY` (see
   `.env.example`, and Vercel → Project Settings → Environment Variables
   for Production + Preview).
2. **Automations** → create (or confirm) a Welcome automation triggered
   on the `website-popup` tag, sending the discount-code email.
3. Nothing else on the codebase side needs to change — the tag, the
   subscribe endpoint, and the popup's copy are already wired to this.

### Explicitly not installed

Omnisend's on-site tracking/behavioral script (the `<script>` snippet
Omnisend's own dashboard offers for browsing/cart-abandonment tracking)
is **not** added anywhere in this codebase. This integration is
signup-only, via the Contacts API — adding the tracking script is a
separate decision, not a required part of getting the popup's discount
code working.
