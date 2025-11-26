import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
