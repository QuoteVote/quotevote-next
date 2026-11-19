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
  /** Controlled show/hide, so one button can reveal several fields. */
  revealed?: boolean;
  onRevealChange?: (revealed: boolean) => void;
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

export interface PublicHeaderLink {
  href: string;
  label: string;
}

export interface PublicHeaderProps {
  /** Section links before Log in, e.g. Explore, How It Works. */
  links?: PublicHeaderLink[];
}

export interface PublicFooterProps {
  /** Where Explore Discussions and Explore point. */
  exploreHref?: string;
}

export interface LandingStepExampleProps {
  n: number;
}

export interface LandingPostCardProps {
  post: import("@/types/post").Post;
}

export interface LandingPagerProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}

export type LandingSort = "desc" | "asc" | "popular";

export interface NewsletterFormProps {
  id: string;
  /** Phones use a plain button, desktop the blue one. */
  variant: "phone" | "desktop";
}

export type NoticeKind =
  | "invalidLink"
  | "invalidInvite"
  | "sessionExpired"
  | "error"
  | "postDeleted"
  | "signingOut"
  | "inTouch"
  | "noPosts"
  | "emailSent"
  | "linkExpired"
  | "linkIncomplete";

export interface NoticeAction {
  label: string;
  /** A link, or an action when `onClick` is given. */
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface NoticeCardProps {
  kind: NoticeKind;
  /** Overrides the standard message, e.g. to name the email address. */
  message?: string;
  /** Overrides the standard buttons. */
  actions?: NoticeAction[];
}

export interface NoticeActionButtonProps {
  action: NoticeAction;
}

export interface NoticeDefinition {
  title: string;
  message: string;
  tone: "yellow" | "blue" | "red" | "green" | "purple";
  icon: ReactNode;
  strokeWidth?: number;
  actions: NoticeAction[];
}

export type DocsPageId = "terms" | "conduct" | "contributing";

export interface DocsSection {
  id: string;
  title: string;
  body: ReactNode;
  /** Plain-language summary shown in the "In short" box. */
  short?: string;
}

export interface DocsLayoutProps {
  current: DocsPageId;
  title: string;
  /** e.g. "Last updated November 19, 2026". */
  eyebrow?: string;
  intro: string;
  sections: DocsSection[];
}

/** One line on a scene's board: a proposal with its up and down votes. */
export interface SceneRow {
  text: string;
  up: number;
  down: number;
}

/** Position of a scene element, as CSS lengths relative to the scene (e.g. "7%"). */
export interface ScenePlacement {
  left: string;
  top: string;
  width: string;
}

export interface SceneBoard extends ScenePlacement {
  title: string;
  rows: SceneRow[];
}

export interface SceneBubble extends ScenePlacement {
  text: string;
  /** Which side the speech tail sits on. */
  tail: "left" | "right" | "center";
}

/** An Avataaars person from /assets/redesign/av, e.g. "d" or "a-glad". */
export interface ScenePerson {
  name: string;
  left: string;
  bottom: string;
  width: string;
  flip?: boolean;
  /** Stacking order among the people (the middle one can sit in front). */
  z?: number;
}

export interface SceneProps {
  /** Accessible description; leave out for a purely decorative scene. */
  label?: string;
  background: string;
  board?: SceneBoard;
  bubbles?: SceneBubble[];
  people?: ScenePerson[];
  /** Text sizes: hero (desktop hero), card (small cards and the phone hero), comic. */
  size: "hero" | "card" | "comic";
  /** Comic panel caption, e.g. "1 · The challenge". */
  panel?: string;
  className?: string;
}

/** A four-panel comic strip on the landing page. */
export interface ComicStripProps {
  episode: number;
  caption: string;
  panels: Omit<SceneProps, "size">[];
}
