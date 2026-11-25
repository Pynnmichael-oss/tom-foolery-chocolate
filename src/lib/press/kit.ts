/**
 * The fixed half of /press: the boilerplate, fact sheet, downloads and
 * press FAQ. These change rarely and are what search engines and AI
 * answers quote most, so they live in code (reviewed, versioned) rather
 * than in the coverage sheet, where a stray edit would go live within
 * the hour.
 *
 * Only verified facts go here. Leave a field empty rather than guess;
 * empty fields are simply not rendered.
 */

/** Media inquiries go here when set; empty → the page links to /contact. */
// TODO(garrett): set a press inbox, e.g. press@tomfoolerychocolate.com.
export const PRESS_EMAIL = "";

/** About-us paragraph, written to be pasted into a story as-is. */
export const BOILERPLATE =
  "Tom Foolery Chocolate is a small-batch chocolate maker in Chicago, Illinois. We make chocolate bars, Malört caramels and gift sets with 100% real chocolate, nostalgic flavors and a little twist on it all. The brand is named for founder Garrett's grandfather, Tom Meldrum, who ran the Sugar Bowl, an old-fashioned candy store in Massillon, Ohio, and was a major tom fool himself. More than 50 years and three generations later, Tom Foolery is an ode to those days: curious chocolates made for mischief and merriment.";

export interface PressFact {
  label: string;
  value: string;
  /** Optional on-site link for the value. */
  href?: string;
}

export const FAST_FACTS: PressFact[] = [
  { label: "Company", value: "Tom Foolery Chocolate (also written Tom Foolery Chocolates)" },
  { label: "Based in", value: "Chicago, Illinois" },
  {
    label: "What we make",
    value: "Small-batch chocolate bars, Malört caramels, sampler packs and gift sets, made with 100% real chocolate",
    href: "/shop",
  },
  { label: "Founder", value: "Garrett, grandson of Tom Meldrum" },
  // TODO(garrett): add { label: "Founded", value: "<year>" } once confirmed.
  {
    label: "The name",
    value: "Tom Meldrum ran the Sugar Bowl, a candy store in Massillon, Ohio",
    href: "/story",
  },
  { label: "Brand idea", value: "Live a Little" },
  {
    label: "Membership",
    value: "The Mischief Society, a chocolate-of-the-month club",
    href: "/mischief-society",
  },
  {
    label: "Where to buy",
    value: "Online, and at independent shops across the U.S.",
    href: "/find-us",
  },
  { label: "Wholesale", value: "Retailers order through Faire", href: "/wholesale" },
  {
    label: "Gifting",
    value: "Custom corporate, wedding and event gifting",
    href: "/gifting",
  },
];

/** Founder bio. The section only renders once `bio` is filled in. */
export const FOUNDER = {
  name: "Garrett",
  role: "Founder",
  // TODO(garrett): 2–3 sentences, third person, for journalists to quote.
  bio: "",
};

/**
 * The press photo library: Google Drive folder "Tom Foolery Photos",
 * shared as "anyone with the link can view". Linked rather than copied
 * into the repo, so a photo added in Drive is available to press at
 * once, at full resolution. If the folder is ever re-shared or moved,
 * update these links.
 */
export const PHOTO_LIBRARY_URL =
  "https://drive.google.com/drive/folders/1fpMneYcyajCAurZ5VVQ07MF98w3r86_h";

export const PHOTO_FOLDERS: Array<{ label: string; description: string; href: string }> = [
  {
    label: "Chocolate Bars",
    description: "Studio shots of the bars, wrapped and broken open.",
    href: "https://drive.google.com/drive/folders/1T-2mJTTTwRISzIPAuMiCuW3EydBWflbB",
  },
  {
    label: "Malört Caramels",
    description: "The Malört caramels, boxed and unboxed.",
    href: "https://drive.google.com/drive/folders/1vJuNbAR_Cb9PYM10NTLjhDsGot6Ri85U",
  },
  {
    label: "Lifestyle & Brand",
    description: "Tom Foolery out in the world.",
    href: "https://drive.google.com/drive/folders/1HqyjUWFzYOGcqnsSwKUUmDCU1YH7Eyoq",
  },
  {
    label: "Gifting Bands",
    description: "The occasion bands for gift sets: birthday, thank you, congrats and more.",
    href: "https://drive.google.com/drive/folders/14iDLg6wjRaHcyOxD4wYLZDFUBfsVtl6e",
  },
];

/** Served straight from /public, so they download from the site itself. */
export const LOGO_FILES: Array<{ label: string; href: string; format: string }> = [
  { label: "Primary logo", href: "/brand/logo-primary.svg", format: "SVG" },
  { label: "Horizontal logo", href: "/brand/logo-horizontal.svg", format: "SVG" },
  { label: "Stacked logo", href: "/brand/logo-stacked.svg", format: "SVG" },
  { label: "Secondary logo", href: "/brand/logo-secondary.svg", format: "SVG" },
  { label: "Tom icon", href: "/brand/icon-eyes-hat.svg", format: "SVG" },
  { label: "Tom icon, dark", href: "/logos/icon-positive.png", format: "PNG" },
  { label: "Tom icon, light", href: "/logos/icon-negative.png", format: "PNG" },
];

export interface PressFaqItem {
  question: string;
  /** Plain text, also used as-is in the FAQPage structured data. */
  answer: string;
  /** Turns the first occurrence of `text` in the answer into a link. */
  link?: { text: string; href: string };
}

export const PRESS_FAQ: PressFaqItem[] = [
  {
    question: "Can I request samples or an interview?",
    answer:
      "Yes. Get in touch with your outlet, the story you're working on and your deadline, and we'll come back to you.",
  },
  {
    question: "Can I use these photos and logos?",
    answer:
      "Yes, for editorial coverage of Tom Foolery Chocolate. Please credit Tom Foolery Chocolate and don't alter the logos.",
  },
  {
    question: "Where is Tom Foolery made?",
    answer: "In small batches in Chicago, Illinois.",
  },
  {
    question: "Where can readers buy it?",
    answer:
      "Online at Tom Foolery Chocolate, and at independent shops across the U.S. The Where to Find Us page has a map of current stockists.",
    link: { text: "Where to Find Us", href: "/find-us" },
  },
];
