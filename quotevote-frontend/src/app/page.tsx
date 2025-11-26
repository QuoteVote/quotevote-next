import Image from "next/image";
import type { ReactElement } from "react";

export default function Home(): ReactElement {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main id="main-content" className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-[var(--color-primary-contrast)] focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Header */}
        <header className="text-center mb-4">
          <figure className="flex justify-center mb-4">
            <Image
              src="/assets/QuoteVoteLogo.png"
              alt="Quote.Vote Logo"
              width={300}
              height={300}
              priority
              sizes="(max-width: 768px) 200px, 300px"
              className="object-contain"
            />
          </figure>
          <h1 className="sr-only">Quote.Vote</h1>
          <p className="text-xl max-w-2xl mx-auto text-[var(--color-text-secondary)]">
            A text-first platform for thoughtful public dialogue
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-[var(--color-white)] rounded-lg shadow-sm p-8 mb-4">
          <section className="mb-4">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--color-text-primary)]">
              About Quote.Vote
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Quote.Vote is an open-source, text-only social platform for thoughtful dialogue. 
              Every post creates its own chatroom where people can quote, vote, and respond in real time.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Built with Next.js, GraphQL, and Tailwind, it fosters deliberative, ad-free conversations 
              for communities and civic collaboration.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--color-text-primary)]">
              Key Features
            </h2>
            <ul className="space-y-3 text-[var(--color-text-secondary)]">
              <li className="flex items-start">
                <span className="text-[var(--color-primary)] mr-3 font-bold">•</span>
                <span>
                  <strong className="text-[var(--color-text-primary)]">Targeted Feedback:</strong> Quote specific text 
                  highlights for precise, contextual responses
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[var(--color-primary)] mr-3 font-bold">•</span>
                <span>
                  <strong className="text-[var(--color-text-primary)]">Public Chat Threads:</strong> Every post becomes 
                  a space for real-time discussion
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[var(--color-primary)] mr-3 font-bold">•</span>
                <span>
                  <strong className="text-[var(--color-text-primary)]">Voting Mechanics:</strong> Support thoughtful 
                  interaction over reactive engagement
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[var(--color-primary)] mr-3 font-bold">•</span>
                <span>
                  <strong className="text-[var(--color-text-primary)]">Ad-Free & Algorithm-Free:</strong> Transparent 
                  conversations without manipulation
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--color-text-primary)]">
              Open Source
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Originally prototyped as Scoreboard, the project is now in preparation for open-source. 
              Our team welcomes remix, reuse, and contributions from developers, designers, and 
              democratic technologists alike.
            </p>
          </section>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <a
              href="https://github.com/QuoteVote"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Quote.Vote on GitHub (opens in new tab)"
              className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)] transition-opacity"
            >
              View on GitHub
            </a>
            <a
              href="https://quote.vote"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Quote.Vote website (opens in new tab)"
              className="px-8 py-3 bg-[var(--color-white)] text-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-lg font-medium hover:bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)] transition-colors"
            >
              Visit Quote.Vote
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
