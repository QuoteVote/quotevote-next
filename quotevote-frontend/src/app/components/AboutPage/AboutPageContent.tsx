import { AboutHeader } from "./AboutHeader";
import { AboutHero } from "./AboutHero";
import { AboutVoteSection } from "./AboutVoteSection";
import { AboutValues } from "./AboutValues";
import { AboutCommunities } from "./AboutCommunities";
import { AboutMessaging } from "./AboutMessaging";
import { AboutCtaBand } from "./AboutCtaBand";
import { AboutCharacters } from "./AboutCharacters";
import { AboutFooter } from "./AboutFooter";

/**
 * Public About page matching the Zeplin marketing artboard (#350).
 */
export function AboutPageContent() {
  return (
    <div
      className="flex min-h-screen max-w-[100vw] flex-col overflow-x-hidden bg-white"
      data-testid="about-page"
    >
      <AboutHeader />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <AboutHero />
        <AboutVoteSection />
        <AboutValues />
        <AboutCommunities />
        <AboutMessaging />
        <AboutCtaBand />
        <AboutCharacters />
      </main>
      <AboutFooter />
    </div>
  );
}
