import { EyesHatIcon } from "@/components/ui/logos";
import { BodyText } from "@/components/ui/typography";

/** Friendly empty state for a collection with zero products — still a
 * real page (not a 404: the collection exists, it's just empty right
 * now), so this stays warm/on-brand rather than reading like an error. */
export function CollectionEmptyState() {
  return (
    <div className="flex flex-col items-center gap-fluid-sm py-fluid-xl text-center">
      <EyesHatIcon tone="positive" width={48} />
      <BodyText className="max-w-sm text-fg/70">
        Nothing&rsquo;s in this collection just yet — check back soon, or find something sweet below.
      </BodyText>
    </div>
  );
}
