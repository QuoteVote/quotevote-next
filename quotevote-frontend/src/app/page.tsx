'use client';

import Image from "next/image";
import type { ReactElement } from "react";

export default function Home(): ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-background)] via-[var(--color-background-off-white)] to-[var(--color-background)]">
      <main id="main-content" className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        {/* Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-[var(--color-primary-contrast)] focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Header */}
        <header className="text-center mb-8">
          <figure className="flex justify-center mb-4">
            <Image
              src="/assets/QuoteVoteLogo.png"
              alt="Quote.Vote Logo"
              width={200}
              height={200}
              priority
              sizes="(max-width: 640px) 150px, 200px"
              className="object-contain"
            />
          </figure>
          <h1 className="sr-only">Quote.Vote</h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            A text-first platform for thoughtful public dialogue
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-[var(--color-white)] rounded-xl shadow-md border border-[var(--color-gray-light)] p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">
            About Quote.Vote
          </h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
            An open-source, text-only social platform for thoughtful dialogue. Every post creates its own chatroom where people can quote, vote, and respond in real time.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[var(--color-background-off-white)] border border-[var(--color-gray-light)]">
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
                Targeted Feedback
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Quote specific text for precise responses
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-background-off-white)] border border-[var(--color-gray-light)]">
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
                Public Chat Threads
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Real-time discussion spaces
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-background-off-white)] border border-[var(--color-gray-light)]">
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
                Voting Mechanics
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Support thoughtful interaction
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-background-off-white)] border border-[var(--color-gray-light)]">
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
                Ad-Free & Algorithm-Free
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Transparent conversations
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Open-source project welcoming contributions from developers, designers, and democratic technologists.
          </p>
        </div>
                
        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/QuoteVote"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Quote.Vote on GitHub (opens in new tab)"
              className="px-6 py-3 bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-opacity"
            >
              View on GitHub
            </a>
            <a
              href="https://quote.vote"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Quote.Vote website (opens in new tab)"
              className="px-6 py-3 bg-[var(--color-white)] text-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-lg font-medium hover:bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors"
            >
              Visit Quote.Vote
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
