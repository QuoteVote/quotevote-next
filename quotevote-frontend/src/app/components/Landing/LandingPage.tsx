import { PublicHeader } from "@/components/Public/PublicHeader";
import { PublicFooter } from "@/components/Public/PublicFooter";
import { LandingFeed } from "./LandingFeed";
import {
  LandingCommunities,
  LandingFaq,
  LandingHero,
  LandingHowItWorks,
  LandingInAction,
  LandingJoin,
  LandingStories,
  LandingValues,
} from "./LandingSections";

/** What guests see at `/`: the landing page, with the public posts as Latest quotes. */
export function LandingPage() {
  return (
    <div
      data-testid="landing-page"
      className="qv-auth qv-pub flex min-h-screen flex-col overflow-x-hidden"
    >
      <PublicHeader />
      <main>
        <LandingHero />
        <LandingValues />
        <LandingHowItWorks />
        <LandingInAction />
        <LandingCommunities />
        <LandingStories />
        <LandingFeed />
        <LandingFaq />
        <LandingJoin />
      </main>
      <PublicFooter />
    </div>
  );
}
