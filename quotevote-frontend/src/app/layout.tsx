import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ApolloProviderWrapper } from "@/lib/apollo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";
import { Eyebrow } from "./components/Eyebrow/Eyebrow";

/**
 * Global Providers Setup:
 * 
 * - ApolloProviderWrapper: Provides Apollo Client context for GraphQL queries/mutations
 *   All client components can use useQuery, useMutation, etc.
 * 
 * - Zustand Store: No provider needed - the store is available globally via useAppStore hook
 *   Import and use: import { useAppStore } from '@/store'
 * 
 * Provider order: ErrorBoundary > ApolloProvider > children
 * This ensures error handling wraps all providers and Apollo is available to all children.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quote.Vote - Text-First Platform for Thoughtful Dialogue",
  description: "An open-source, text-only social platform for thoughtful dialogue. Every post creates its own chatroom where people can quote, vote, and respond in real time.",
  keywords: ["quote", "vote", "dialogue", "civic engagement", "open source", "democracy", "discussion"],
  authors: [{ name: "Quote.Vote Team" }],
  openGraph: {
    title: "Quote.Vote",
    description: "A text-first platform for thoughtful public dialogue",
    type: "website",
    url: "https://quote.vote",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quote.Vote",
    description: "A text-first platform for thoughtful public dialogue",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ApolloProviderWrapper>
            <>
            <Eyebrow />
            {children}
            </>
          </ApolloProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
