export type PressType = "Article" | "Gift Guide" | "Podcast" | "Video" | "Award";

/** One row of the press sheet that made it onto the page. */
export interface PressMention {
  /** YYYY-MM-DD */
  date: string;
  outlet: string;
  headline: string;
  url: string;
  type: PressType;
  quote?: string;
  author?: string;
  /** Optional outlet logo image URL from the sheet's Logo column. */
  logo?: string;
  featured: boolean;
}

/** src/data/press.json, written by `npm run sync-press`. */
export interface PressSnapshot {
  updatedAt: string | null;
  mentions: PressMention[];
}
