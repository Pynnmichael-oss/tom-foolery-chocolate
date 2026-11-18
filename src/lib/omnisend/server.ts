/**
 * Server-side Omnisend REST client (contacts + custom events). Separate
 * from the on-site snippet (components/analytics/OmnisendSnippet.tsx),
 * which only needs the public brand ID.
 *
 * Env: OMNISEND_API_KEY — Omnisend → Store settings → API keys. Needs
 * contacts and events write access. Server-only.
 *
 * API reference: https://api-docs.omnisend.com (version pinned below).
 */

const OMNISEND_BASE = "https://api.omnisend.com/api";
const OMNISEND_VERSION = "2026-03-15";

export class OmnisendError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OmnisendError";
  }
}

export function isOmnisendConfigured(): boolean {
  return Boolean(process.env.OMNISEND_API_KEY);
}

async function omnisendPost(path: string, body: unknown): Promise<void> {
  const key = process.env.OMNISEND_API_KEY;
  if (!key) throw new OmnisendError("Omnisend is not configured — set OMNISEND_API_KEY.");

  let response: Response;
  try {
    response = await fetch(`${OMNISEND_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Omnisend-API-Key ${key}`,
        "Omnisend-Version": OMNISEND_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (cause) {
    throw new OmnisendError(`Failed to reach Omnisend (${path}): ${String(cause)}`);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new OmnisendError(`Omnisend ${path} → HTTP ${response.status}: ${text.slice(0, 300)}`, response.status);
  }
}

export interface ContactUpsert {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  customProperties?: Record<string, string | number | boolean>;
}

/**
 * Creates or updates a contact by email. Deliberately sends no channel
 * status: an existing subscriber stays subscribed, and a new contact
 * (e.g. a gift recipient) is NOT opted in to marketing.
 */
export async function upsertContact(contact: ContactUpsert): Promise<void> {
  await omnisendPost("/contacts", {
    identifiers: [{ type: "email", id: contact.email, sendWelcomeMessage: false }],
    ...(contact.firstName ? { firstName: contact.firstName } : {}),
    ...(contact.lastName ? { lastName: contact.lastName } : {}),
    ...(contact.tags?.length ? { tags: contact.tags } : {}),
    ...(contact.customProperties ? { customProperties: contact.customProperties } : {}),
  });
}

/** Sends a custom event, which Omnisend automations can trigger on.
 * `eventID` is Omnisend's optional unique event identifier (UUID). */
export async function sendCustomEvent(event: {
  name: string;
  email: string;
  eventID?: string;
  properties: Record<string, unknown>;
}): Promise<void> {
  await omnisendPost("/events", {
    eventName: event.name,
    origin: "api",
    ...(event.eventID ? { eventID: event.eventID } : {}),
    contact: { email: event.email },
    properties: event.properties,
  });
}
