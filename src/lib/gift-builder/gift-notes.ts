/*
 * Gift messages live in the CART NOTE, which becomes the Shopify order note and then
 * ShipStation’s "Notes from Buyer", the field the gift card template prints.
 *
 * Each set gets a label (A, B, C...) stored as the "Set" property on its cart line,
 * and its message is stored in the note under the same label:
 *
 *   GIFT MESSAGES
 *   Set A: Happy holidays, Mom! Love, G
 *   Set B: Congrats on the new job!
 *
 * Packers match "Set: A" on the item to "Set A:" on the card. Sets without a message
 * are left out. The note is rebuilt whenever a set is added or removed, so it always
 * matches the cart.
 */

const HEADER = "GIFT MESSAGES";
const LINE_RE = /^Set ([A-Z]{1,2}): (.*)$/;

export type GiftMessages = Map<string, string>; // label -> message

type LineLike = { attributes: { key: string; value: string | null }[] };

/** Read the gift messages out of a cart note. Any other text in the note is kept separately. */
export function parseGiftNote(note: string | null | undefined): { messages: GiftMessages; other: string } {
  const messages: GiftMessages = new Map();
  const other: string[] = [];
  for (const raw of (note ?? "").split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(LINE_RE);
    if (m) messages.set(m[1], m[2]);
    else if (line.trim() !== HEADER) other.push(line);
  }
  return { messages, other: other.join("\n").trim() };
}

/** Build the cart note from messages (sorted A, B, ... AA) plus any other note text. */
export function formatGiftNote(messages: GiftMessages, other = ""): string {
  const labels = [...messages.keys()].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const block = labels.length
    ? [HEADER, ...labels.map((l) => `Set ${l}: ${messages.get(l)}`)].join("\n")
    : "";
  return [other, block].filter(Boolean).join("\n\n");
}

export const labelOf = (line: LineLike) => line.attributes.find((a) => a.key === "Set")?.value ?? null;

function labelToNumber(label: string) {
  return [...label].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);
}
function numberToLabel(n: number) {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Next unused set label for this cart: A, B, ... Z, AA. Never reuses a label still in the cart. */
export function nextSetLabel(lines: LineLike[], note?: string | null): string {
  const used = new Set<string>();
  for (const l of lines) {
    const label = labelOf(l);
    if (label) used.add(label);
  }
  for (const label of parseGiftNote(note).messages.keys()) used.add(label);
  const max = Math.max(0, ...[...used].map(labelToNumber));
  return numberToLabel(max + 1);
}

/** Note after adding a set’s message (no-op if the set has no message). */
export function addGiftMessage(note: string | null | undefined, label: string, message: string | null) {
  const { messages, other } = parseGiftNote(note);
  if (message) messages.set(label, message);
  return formatGiftNote(messages, other);
}

/**
 * Note that matches the cart’s current lines: drops messages whose set is no longer
 * in the cart. Call after removing a line (or before checkout as a safety net).
 */
export function syncGiftNote(note: string | null | undefined, lines: LineLike[]) {
  const { messages, other } = parseGiftNote(note);
  const live = new Set(lines.map(labelOf).filter(Boolean) as string[]);
  for (const label of [...messages.keys()]) if (!live.has(label)) messages.delete(label);
  return formatGiftNote(messages, other);
}

/**
 * Every cart line belonging to a set (parent + components). Remove these together, e.g.
 *   await removeLines(linesInSet(cart.lines, label).map((l) => l.id));
 *   await updateNote(syncGiftNote(cart.note, remainingLines));
 */
export function linesInSet<T extends LineLike>(lines: T[], label: string): T[] {
  return lines.filter((l) => labelOf(l) === label);
}

/** Group cart lines by set label for the cart drawer; lines without a Set go under null. */
export function groupBySet<T extends LineLike>(lines: T[]): Map<string | null, T[]> {
  const groups = new Map<string | null, T[]>();
  for (const l of lines) {
    const k = labelOf(l);
    groups.set(k, [...(groups.get(k) ?? []), l]);
  }
  return groups;
}
