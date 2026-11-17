import { FeaturedList } from "./FeaturedList";
import { YourDiscussions } from "./YourDiscussions";

/** Right column of the signed-in home page. */
export function HomeHighlights() {
  return (
    <aside
      aria-label="Highlights"
      data-testid="home-highlights"
      className="font-redesign flex flex-col gap-4 pt-8"
    >
      <FeaturedList />
      <YourDiscussions />
    </aside>
  );
}
