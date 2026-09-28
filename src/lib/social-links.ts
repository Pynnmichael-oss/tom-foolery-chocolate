export interface SocialLink {
  label: string;
  href: string;
}

/**
 * Footer social links (`Footer.tsx`). An empty `href` hides that entry —
 * a dead `#` link is worse than no link at all — so these ship disabled
 * until the real profile exists, rather than as a placeholder that goes
 * nowhere.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  // TODO(garrett): add the real Instagram profile URL.
  { label: "Instagram", href: "" },
  // TODO(garrett): add the real TikTok profile URL.
  { label: "TikTok", href: "" },
];
