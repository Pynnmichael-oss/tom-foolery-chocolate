import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { ORGANIZATION_ID } from "@/components/seo/OrganizationJsonLd";
import { getPressMentions, type PressMention } from "@/lib/press";
import {
  BOILERPLATE,
  FAST_FACTS,
  FOUNDER,
  LOGO_FILES,
  PHOTO_FOLDERS,
  PHOTO_LIBRARY_URL,
  PRESS_EMAIL,
  PRESS_FAQ,
  type PressFaqItem,
} from "@/lib/press/kit";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Press & Media Kit";
const DESCRIPTION =
  "Press coverage, fast facts, photos and logos for Tom Foolery Chocolate, the small-batch chocolate maker in Chicago. Media inquiries welcome.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/press" },
  // images: DEFAULT_OG_IMAGE, see that constant's comment in lib/site.ts.
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/press",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

// How often the press sheet is re-read (ISR). Has to be a literal here,
// since Next reads route segment config statically, so keep it equal to
// PRESS_SHEET_REVALIDATE_SECONDS in src/lib/press/sheet.ts.
export const revalidate = 3600;

const CONTACT_HREF = PRESS_EMAIL
  ? `mailto:${PRESS_EMAIL}?subject=${encodeURIComponent("Press inquiry")}`
  : "/contact";

/** The answer text, with `item.link.text` (if present) as an on-site link. */
function FaqAnswer({ item }: { item: PressFaqItem }) {
  const at = item.link ? item.answer.indexOf(item.link.text) : -1;
  if (!item.link || at === -1) return <>{item.answer}</>;
  return (
    <>
      {item.answer.slice(0, at)}
      <Link href={item.link.href} className="underline underline-offset-2 hover:text-tf-cinnamon-strong">
        {item.link.text}
      </Link>
      {item.answer.slice(at + item.link.text.length)}
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Structured data for the page: an AboutPage about the site-wide
 * Organization (same @id as OrganizationJsonLd, so crawlers merge them),
 * adding each piece of coverage as `subjectOf`, awards as `award`, the
 * founder, and the press FAQ.
 */
function pressJsonLd(mentions: PressMention[]): Record<string, unknown> {
  const coverage = mentions.filter((m) => m.type !== "Award");
  const awards = mentions.filter((m) => m.type === "Award");
  const workType = (m: PressMention) =>
    m.type === "Podcast" ? "PodcastEpisode" : m.type === "Video" ? "VideoObject" : "NewsArticle";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${SITE_URL}/press#webpage`,
        url: `${SITE_URL}/press`,
        name: `${TITLE} | ${SITE_NAME}`,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": ORGANIZATION_ID },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        description: BOILERPLATE,
        founder: { "@type": "Person", name: FOUNDER.name, jobTitle: FOUNDER.role },
        ...(awards.length > 0
          ? { award: awards.map((a) => `${a.headline}, ${a.outlet} (${a.date.slice(0, 4)})`) }
          : {}),
        ...(coverage.length > 0
          ? {
              subjectOf: coverage.map((m) => ({
                "@type": workType(m),
                // VideoObject has no headline; name works for every type.
                name: m.headline,
                ...(workType(m) === "NewsArticle" ? { headline: m.headline } : {}),
                url: m.url,
                datePublished: m.date,
                publisher: { "@type": "Organization", name: m.outlet },
                ...(m.author ? { author: { "@type": "Person", name: m.author } } : {}),
              })),
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/press#faq`,
        mainEntity: PRESS_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

/**
 * Press & media kit. Coverage comes live from the press Google Sheet
 * (lib/press, re-read hourly, falling back to src/data/press.json); the
 * boilerplate, facts, downloads and FAQ are fixed in lib/press/kit.ts.
 * Everything a journalist or crawler needs is plain text on the page,
 * not locked in a PDF or an image. Plain utility-page treatment, no GSAP,
 * same as /find-us and /contact.
 */
export default async function PressPage() {
  const mentions = await getPressMentions();
  const featured = mentions.filter((m) => m.featured && m.quote);
  const rest = mentions.filter((m) => !featured.includes(m));

  return (
    <main id="main-content">
      <BreadcrumbJsonLd crumbs={[{ name: "Press", path: "/press" }]} />
      <JsonLd data={pressJsonLd(mentions)} />

      {/* Intro + boilerplate */}
      <section className="px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-fluid-sm text-center">
          <Preheader>Press &amp; Media</Preheader>
          <Headline as="h1" size="md">
            The Tom Foolery Press Kit
          </Headline>
          <BodyText className="max-w-2xl text-fg/80">{BOILERPLATE}</BodyText>
          <div className="mt-fluid-xs flex flex-wrap justify-center gap-fluid-sm">
            <a href={CONTACT_HREF} className={buttonClasses("primary")}>
              Media Inquiries
            </a>
            <a
              href={PHOTO_LIBRARY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary")}
            >
              Download Photos
            </a>
          </div>
        </div>
      </section>

      {/* Coverage, only once there is some */}
      {mentions.length > 0 && (
        <section className="bg-tf-turmeric/25 px-fluid-md py-fluid-xl">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-fluid-lg">
            <div className="flex flex-col items-center gap-fluid-xs text-center">
              <Preheader>In the News</Preheader>
              <Headline as="h2" size="sm">
                Press Coverage
              </Headline>
            </div>

            {featured.length > 0 && (
              <ul
                className={`grid gap-fluid-md ${
                  featured.length === 1 ? "mx-auto w-full max-w-xl" : "md:grid-cols-2"
                }`}
              >
                {featured.map((m) => (
                  <li key={m.url} className="flex">
                    <figure className="flex w-full flex-col gap-fluid-xs rounded-[4px] border-[1.5px] border-tf-black bg-tf-white p-fluid-md">
                      <blockquote cite={m.url} className="font-display text-xl leading-snug">
                        &ldquo;{m.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-auto font-sans text-sm text-fg/80">
                        <span className="font-black uppercase tracking-[0.075em]">{m.outlet}</span>
                        {" · "}
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener"
                          className="underline underline-offset-2 hover:text-tf-cinnamon-strong"
                        >
                          {m.headline}
                        </a>
                        {" · "}
                        <time dateTime={m.date}>{formatDate(m.date)}</time>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            )}

            {rest.length > 0 && (
              <ul className="flex flex-col divide-y divide-tf-black/15 border-y border-tf-black/15">
                {rest.map((m) => (
                  <li key={m.url} className="flex flex-col gap-1 py-fluid-sm sm:flex-row sm:items-baseline sm:gap-fluid-md">
                    <p className="shrink-0 font-sans text-sm text-fg/70 sm:w-40">
                      <time dateTime={m.date}>{formatDate(m.date)}</time>
                    </p>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-sans text-sm font-black uppercase tracking-[0.075em]">
                        {m.outlet}
                        <span className="ml-2 font-normal normal-case tracking-normal text-fg/60">
                          {m.type}
                        </span>
                      </p>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener"
                        className="font-display text-lg underline-offset-2 hover:underline"
                      >
                        {m.headline}
                      </a>
                      {m.quote && (
                        <p className="font-sans text-sm text-fg/80">&ldquo;{m.quote}&rdquo;</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Fast facts */}
      <section className="px-fluid-md py-fluid-xl">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-fluid-md">
          <div className="flex flex-col items-center gap-fluid-xs text-center">
            <Preheader>At a Glance</Preheader>
            <Headline as="h2" size="sm">
              Fast Facts
            </Headline>
          </div>
          <dl className="grid gap-x-fluid-md border-t border-tf-black/15 sm:grid-cols-[12rem_1fr]">
            {FAST_FACTS.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="pt-fluid-sm font-sans text-sm font-black uppercase tracking-[0.075em] sm:border-b sm:border-tf-black/15 sm:pb-fluid-sm">
                  {fact.label}
                </dt>
                <dd className="border-b border-tf-black/15 pb-fluid-sm font-sans sm:pt-fluid-sm">
                  {fact.href ? (
                    <Link href={fact.href} className="underline underline-offset-2 hover:text-tf-cinnamon-strong">
                      {fact.value}
                    </Link>
                  ) : (
                    fact.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Founder + heritage photo */}
      <section className="bg-tf-juniper/30 px-fluid-md py-fluid-xl">
        <div className="mx-auto grid w-full max-w-4xl items-center gap-fluid-lg md:grid-cols-2">
          <Image
            src="/photos/heritage-founding-family.jpg"
            alt="Black-and-white family photo from the Sugar Bowl era: five people holding a cake decorated with a floral wreath"
            width={847}
            height={703}
            sizes="(min-width: 768px) 28rem, 100vw"
            className="h-auto w-full rounded-[4px]"
          />
          <div className="flex flex-col gap-fluid-sm">
            <Preheader>The Story</Preheader>
            <Headline as="h2" size="sm">
              Before There Was Tom Foolery, There Was Tom Meldrum
            </Headline>
            <BodyText className="text-fg/80">
              {FOUNDER.bio ||
                "Tom Meldrum, our founder Garrett's grandfather, ran the Sugar Bowl, a good old-fashioned candy store in the heart of Massillon, Ohio. Tom Foolery carries his name and his idea of a little joy in your day."}
            </BodyText>
            <Link href="/story" className={buttonClasses("secondary", "self-start")}>
              Read Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Downloads */}
      <section className="px-fluid-md py-fluid-xl">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-fluid-lg">
          <div className="flex flex-col items-center gap-fluid-xs text-center">
            <Preheader>Assets</Preheader>
            <Headline as="h2" size="sm">
              Photos &amp; Logos
            </Headline>
            <BodyText className="max-w-xl text-fg/80">
              High-resolution photos live in our press library on Google Drive. Free to use for
              editorial coverage; please credit Tom Foolery Chocolate.
            </BodyText>
          </div>

          <ul className="grid gap-fluid-sm sm:grid-cols-2">
            {PHOTO_FOLDERS.map((folder) => (
              <li key={folder.href}>
                <a
                  href={folder.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col gap-1 rounded-[4px] border-[1.5px] border-tf-black p-fluid-md transition-colors hover:bg-tf-turmeric/25"
                >
                  <span className="font-sans font-black uppercase tracking-[0.075em]">
                    {folder.label} &rarr;
                  </span>
                  <span className="font-sans text-sm text-fg/80">{folder.description}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-fluid-sm">
            <h3 className="text-center font-sans font-black uppercase tracking-[0.075em]">Logos</h3>
            <ul className="flex flex-wrap justify-center gap-fluid-xs">
              {LOGO_FILES.map((logo) => (
                <li key={logo.href}>
                  <a
                    href={logo.href}
                    download
                    className="inline-block rounded-[4px] border border-tf-black/30 px-fluid-sm py-fluid-xs font-sans text-sm hover:border-tf-black"
                  >
                    {logo.label} <span className="text-fg/60">({logo.format})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Press FAQ + contact */}
      <section className="bg-tf-rose/30 px-fluid-md py-fluid-xl">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-fluid-md">
          <div className="flex flex-col items-center gap-fluid-xs text-center">
            <Preheader>For Journalists</Preheader>
            <Headline as="h2" size="sm">
              Press Questions
            </Headline>
          </div>
          <dl className="flex flex-col gap-fluid-sm">
            {PRESS_FAQ.map((item) => (
              <div key={item.question} className="flex flex-col gap-1">
                <dt className="font-sans font-black">{item.question}</dt>
                <dd className="font-sans text-fg/80">
                  <FaqAnswer item={item} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col items-center gap-fluid-xs pt-fluid-sm text-center">
            <BodyText className="text-fg/80">
              Working on a story?{" "}
              {PRESS_EMAIL ? (
                <>
                  Email{" "}
                  <a href={CONTACT_HREF} className="underline underline-offset-2">
                    {PRESS_EMAIL}
                  </a>
                  .
                </>
              ) : (
                "Send us a note and we'll get back to you."
              )}
            </BodyText>
            <a href={CONTACT_HREF} className={buttonClasses("primary")}>
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
