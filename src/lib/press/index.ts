import snapshotJson from "@/data/press.json";
import { fetchPressSheetCsv, mentionsFromCsv, pressSheetUrl } from "./sheet";
import type { PressMention, PressSnapshot } from "./types";

export type { PressMention, PressType } from "./types";
export { PRESS_SHEET_REVALIDATE_SECONDS } from "./sheet";

const snapshot = snapshotJson as PressSnapshot;

/**
 * Every piece of coverage /press shows (also read by llms.txt).
 *
 * Live from the press Google Sheet (see sheet.ts), re-read about hourly.
 * A sheet with no Live rows yet is a real answer and returns []. If the
 * sheet can't be read at all (no URL set, Google down, tab unpublished,
 * a header renamed), it serves the committed snapshot
 * (src/data/press.json) instead, so the page never loses coverage it
 * already had.
 */
export async function getPressMentions(): Promise<PressMention[]> {
  if (!pressSheetUrl()) return snapshot.mentions;
  try {
    return mentionsFromCsv(await fetchPressSheetCsv());
  } catch (error) {
    console.error("[press] Press sheet read failed, serving the committed snapshot instead.", error);
    return snapshot.mentions;
  }
}
