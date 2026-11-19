import type { InputHTMLAttributes, ReactNode, Ref } from "react";

/** Colour of a chip card on the dark side of the access pages. */
export type AccessChipLight = "post" | "up" | "quote" | "comment";

/** Tag colour inside a chip card. */
export type AccessChipTag = "info" | "up" | "quote" | "comment";

export interface AccessChip {
  light: AccessChipLight;
  tag: AccessChipTag;
  /** Text inside the small tag, e.g. "↑ Agree", "1" or "Tip". */
  label: string;
  text: string;
  /** Left offset in px, to stagger the cards as in the design. */
  offset?: number;
}

export interface AccessLink {
  href: string;
  label: string;
}

export interface AccessSplitLayoutProps {
  /** Headline lines in white; the last line in `accent` is green and italic. */
  lines: string[];
  accent: string;
  chips: AccessChip[];
  /** Muted prompt and button at the top right, e.g. "New here?" and Request Invite. */
  prompt: string;
  action: AccessLink;
  /** Width of the form column on desktop: 420px for most pages, 440px for signup. */
  formWidth?: 420 | 440;
  children: ReactNode;
}

export interface AccessFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  ref?: Ref<HTMLInputElement>;
  label: string;
  /** Link shown at the right of the label row, e.g. Forgot password?. */
  labelLink?: AccessLink;
  error?: string;
  hint?: string;
  /** Adds the show/hide button to a password field. */
  revealable?: boolean;
  /** Shows the lock icon of a read-only field. */
  locked?: boolean;
}

export interface AccessConsentProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  ref?: Ref<HTMLInputElement>;
  document: "terms" | "conduct";
  error?: string;
}

export interface AccessFormHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Hides the subtitle on phones, as the phone design does. */
  subtitleDesktopOnly?: boolean;
}

export interface AccessNoticeProps {
  title: string;
  message: string;
  action?: AccessLink;
}

export interface AccessFootnoteProps {
  text: string;
  link: AccessLink;
}

export interface AccessHeadlineProps {
  lines: string[];
  accent: string;
  className: string;
}

export interface AccessChipCardsProps {
  chips: AccessChip[];
}
