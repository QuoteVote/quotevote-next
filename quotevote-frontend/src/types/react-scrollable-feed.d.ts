/**
 * Type declarations for react-scrollable-feed
 * TODO: Install @types/react-scrollable-feed or migrate to alternative
 */
declare module 'react-scrollable-feed' {
  import type { ReactNode } from 'react';

  interface ScrollableFeedProps {
    children: ReactNode;
    className?: string;
    [key: string]: unknown;
  }

  export default function ScrollableFeed(props: ScrollableFeedProps): JSX.Element;
}

