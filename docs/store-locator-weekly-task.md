# Weekly store locator update — task setup

The scheduled task that keeps the `/find-us` map current. It reads HubSpot
for wholesale accounts with paid orders, looks up each new shop's real
storefront address on the web, and writes the result to the
**Tom Foolery Store Locator** Google Sheet. The website reads that sheet;
the task never writes to HubSpot and never touches the website.

For how the sheet and the site fit together, see
[INTEGRATIONS.md](./INTEGRATIONS.md) → "Store locator".

## Settings

| Setting | Value |
| --- | --- |
| Name | Weekly store locator update |
| Schedule | Every Monday, 6:38 AM Central (`CRON_TZ=America/Chicago 38 6 * * 1`) |
| Runs as | A new session each time (no memory between runs; the sheet is the memory) |
| Notifications | Push on; the task only pushes when something needs a decision or a connector fails |
| Connectors | **HubSpot**, **Google Sheets**, **Firecrawl** — all three are required |

What each connector is for:

- **HubSpot** — read-only: one company search per run for accounts with a
  paid order in the last 90 days.
- **Firecrawl** — web search, to find each new shop's public storefront
  address. One or two searches per new account, usually 0–6 accounts a week.
- **Google Sheets** — reads and writes the two tabs of the sheet
  (id `1Vp7_dqUGr9IN9ntpPRVpImIwf7tWSfIPPjyQcLxWOCM`).

## Setting it up

A task named **Weekly store locator update** already exists in your
scheduled tasks on claude.ai with this exact prompt, but it has **no
connectors attached**, so it can't do anything yet. Either:

1. **Fix the existing task (quickest).** Open it in your scheduled tasks,
   add the HubSpot, Google Sheets and Firecrawl connectors, save.
2. **Or create a fresh one.** New scheduled task → name and schedule from
   the table above → attach the three connectors → paste the prompt below
   → save. Then delete the old connector-less task so two don't run.

Then run it once by hand ("Run now") and check:

- it finishes with a short summary message rather than a "connector
  failed" notice;
- the **Stores** tab has no duplicated rows and no changed addresses;
- any row it added has a Status of *Listed* or *Needs review*, and
  *Needs review* rows have an empty Street.

With nothing new in HubSpot, a healthy run just refreshes some
"Last paid order" dates and says so in one line.

## What it will and won't do

- **Adds** a row to the Stores tab for each HubSpot account not already
  there (matched on HubSpot ID), and a matching row to the Research log.
- **Updates** only "Last paid order" and "Updated" on existing rows.
- **Never** changes a name, status, address, website, Instagram or phone
  already in the sheet; never touches rows without a HubSpot ID (those
  are hand-added); never deletes or re-sorts rows.
- **Lists a street address only** when the shop's own website gives it,
  or two independent listings agree. Anything doubtful goes in as *Needs
  review* with no street, and you get a push.
- **To answer a flagged store:** set its Status (and Street, if you know
  it) in the Stores tab. The website follows within about an hour.

## Prompt

Paste everything inside the block.

```text
Weekly store locator update for Garrett (founder, Tom Foolery Chocolates, Chicago). Runs unattended every Monday morning. Garrett set this flow on Nov 16, 2026: HubSpot is READ-ONLY input; the Google Sheet is the SOURCE OF TRUTH for the website's store map; this task's only writes are to that sheet. Do nothing outside what is described here.

HOW IT FITS TOGETHER. The website's "Where to Find Us" map (tomfoolerychocolate.com/find-us) shows exactly what the "Stores" tab of the sheet says, re-read about hourly, and drops a store 90 days after the date in its "Last paid order" column. The website never reads HubSpot. Your job each week: (1) bring NEW wholesale accounts from HubSpot into the sheet, with the shop's real storefront address when you can verify it; (2) refresh "Last paid order" dates on rows already in the sheet. A person's edits in the sheet always win: never overwrite them.

LOAD TOOLS with ToolSearch: "hubspot" (search_crm_objects only; you never write to HubSpot), "firecrawl search", "google sheets" (get_values, append_values, update_values).

THE SHEET: "Tom Foolery Store Locator", id 1Vp7_dqUGr9IN9ntpPRVpImIwf7tWSfIPPjyQcLxWOCM. Two tabs.

Tab "Stores" (SOURCE OF TRUTH, and PUBLISHED TO THE WEB, so everything in it is public). Header row, columns A-L:
A Store | B Status | C Street | D City | E State | F ZIP | G Website | H Instagram | I Phone | J Last paid order | K HubSpot ID | L Updated
- Status is a dropdown: Listed (map shows street address and exact pin) / City only / Needs review (both show name and "City, ST" only) / Hidden (not on the map).
- Street/City/State/ZIP are the shop a customer walks into. NEVER put a ship-to, home, or unverified address in this tab, and never put notes here.
- Rows with no HubSpot ID were added by hand by Garrett: never touch them.
- Write ZIP, Phone, dates and HubSpot ID as text with a leading apostrophe so they are not reformatted (e.g. '04543, '2026-11-16). Dates are YYYY-MM-DD, Central time.

Tab "Research log" (private working notes, not published). Columns A-N:
A Store | B Locator status | C Storefront street | D Storefront city | E State | F ZIP | G Result | H Needs Garrett? | I Note | J Source | K Ship-to on file (HubSpot) | L HubSpot ID | M Checked on | N Added to Stores tab
One row per company you have researched. Ship-to addresses and reasoning go here only.

STEP 1. READ BOTH SIDES.
 a. Read all of Stores!A:L and Research log!A:N. Find columns by header name in case they have been re-ordered. Build a lookup of Stores rows by HubSpot ID.
 b. HubSpot search_crm_objects, objectType COMPANY, filter last_order_date GTE (today minus 90 days), limit 200, properties: name, address, address2, city, state, zip, website, phone, instagram_handle, company_category, account_channel, last_order_date, order_count, lifetime_revenue. Page through if total exceeds 200. Keep only real retail accounts: order_count > 0 AND lifetime_revenue > 0 AND company_category is not media or corporate_gifting AND account_channel is not corporate. Skip the rest silently.
 HubSpot's address/city/state/zip on a company is the marketplace SHIP-TO (set by "TF Ops Sync" from Faire orders). For about 1 in 4 accounts it is the owner's home or a sister business, not the shop. Treat it as a lead for research, never as the storefront.

STEP 2. REFRESH ORDER DATES on rows already in Stores. For each HubSpot company whose ID is already in Stores column K: if HubSpot's last_order_date is later than column J (or J is blank), set J to it and L to today. Change NOTHING else on an existing row: not the name, status, address, website, Instagram or phone, even if they differ from HubSpot or look wrong to you (mention real concerns in the summary instead). Do not delete or re-sort rows; a store whose date is old simply ages off the map by itself. Batch these into as few update_values calls as practical.

STEP 3. RESEARCH NEW ACCOUNTS: HubSpot companies from Step 1b whose ID is NOT in Stores column K (usually 0 to 6 a week). For each, use firecrawl_search (sources ["web"], limit 4-5, domainTools false), query like: "<company name>" <ship-to city> <state> address. One or two searches each; scrape a page only if the snippets are not enough. Prefer the business's own website, then Google/Yelp/Facebook/Instagram/chamber-of-commerce listings. The business must be in or near the ship-to city (same metro or a neighbouring town); beware same-named businesses elsewhere. For generic names (e.g. "MADE", "Relish", "Open House") require the listing to match on town AND type of shop. Note if it trades under a different public name, has several locations (pick the one matching the ship-to; if the ship-to matches none, pick none), is seasonal/pop-up, members-only, or looks closed.

STEP 4. DECIDE, conservatively. Publishing a private home address is the one mistake that matters; when in doubt, do not list.
 - LISTED: only when the business's own website states the storefront address, OR at least two independent listings agree on it, AND you are confident it is the same business as the HubSpot account, AND it is a place the public can walk into and buy. Result = "Confirmed" if it equals the ship-to (ignoring abbreviations/units), "Corrected" if different.
 - NEEDS REVIEW: sources conflict, identity is not proven, it looks permanently closed, it is seasonal/pop-up/market-stall only, members-only, online-only or home-based with no public shop, or you found nothing reliable. Result = "Unsure" (or "No storefront").
 Never invent or infer a street number or ZIP.

STEP 5. ADD EACH NEW ACCOUNT TO THE SHEET (append_values; first re-check column K / L so no company ever gets a second row).
 Stores tab, one row:
 - Listed: A = name as HubSpot has it (do not restyle; put any different trading name in the Research log note); B = Listed; C = verified storefront street (unit as ", Suite 2"; no PO boxes); D/E/F = the storefront's city, 2-letter state, 5-digit ZIP; G/H/I = website, Instagram handle (@name), phone as (xxx) xxx-xxxx when HubSpot or the shop's own site gives them, else blank; J = HubSpot last_order_date; K = HubSpot company ID; L = today.
 - Needs review: same, but B = Needs review, C BLANK, and D/E/F = the town, state and ZIP only (the verified storefront's if you found a likely one, otherwise the ship-to's town/state/ZIP; a town is safe to show, a street is not).
 Research log tab, one row: A name; B Listed / Needs review; C-F the storefront you found (or the candidate, if unsure); G Result; H = YES for Needs review rows, else blank; I = note, for flagged rows starting "DECIDE:" and saying in one sentence what Garrett needs to decide and what you found; J best source URL; K the ship-to exactly as HubSpot has it; L HubSpot ID; M today; N today.

STEP 6. TIDY THE FLAGS. For each Research log row with H = YES: look up that HubSpot ID in Stores. If its Status there is no longer "Needs review" (Garrett has decided), clear H in the Research log. Never change anything in Stores for this. Rows still "Needs review" are still waiting on him.

STEP 7. SUMMARY. One SendUserMessage, short and phone-readable: new accounts added (store, town; say "ship-to was a different address" where corrected); each new one flagged, with the one-line decision needed; how many order dates were refreshed; stores still waiting on Garrett; how many rows are currently on the map (Status not Hidden and Last paid order within 90 days or blank) and how many will age off in the next 14 days (name them); the sheet link https://docs.google.com/spreadsheets/d/1Vp7_dqUGr9IN9ntpPRVpImIwf7tWSfIPPjyQcLxWOCM. Remind him, only when something is flagged, that he decides by editing the Status (and Street) of that row in the Stores tab, and the website follows within about an hour. If nothing was new and nothing is waiting, say so in one line. Send a PushNotification only when something needs Garrett's decision or a connector failed (name which); otherwise no push.

RULES. Never write to HubSpot. Never edit, delete or reorder existing Stores rows beyond columns J and L in Step 2. Never rename headers or tabs. Do not touch the website or its repository. If a connector fails or needs sign-in, say which, do what you still can, and never guess data you could not read. After sending the summary, end the run with at most one short line.
```

## Changing it later

- **A different window than 90 days:** change `STOCKIST_WINDOW_DAYS` in
  `src/lib/stockists/index.ts` (what the site shows) *and* the "today
  minus 90 days" in Step 1b of the prompt (what the task pulls).
- **New sheet columns:** add them freely; both the site and the task find
  columns by header name. Don't rename the existing headers or the two
  tabs.
- **A different day or time:** change the schedule only; the prompt
  doesn't depend on it.
