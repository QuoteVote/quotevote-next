"use client";

import type { FC, KeyboardEvent, MouseEvent } from "react";
import { useRef } from "react";

type ChatTabValue = "chats" | "groups" | "buddies";

interface ChatTabsProps {
  value: ChatTabValue;
  onChange: (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
    value: ChatTabValue
  ) => void;
  /** Incoming buddy requests: the red badge on Buddies. */
  requestCount?: number;
  /** id of the element the tabs switch, for aria-controls */
  panelId?: string;
}

const TABS: { value: ChatTabValue; label: string }[] = [
  { value: "chats", label: "Chats" },
  { value: "groups", label: "Discussions" },
  { value: "buddies", label: "Buddies" },
];

/** Chats / Discussions / Buddies as the design's segmented control. */
const ChatTabs: FC<ChatTabsProps> = ({ value, onChange, requestCount = 0, panelId }) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Arrow keys move between tabs, as in any tab list.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    tabRefs.current[next]?.focus();
    onChange(event, TABS[next].value);
  };

  return (
    <div role="tablist" aria-label="Messages" className="qv-seg qv-msg-tabs">
      {TABS.map(({ value: tab, label }, index) => {
        const selected = value === tab;
        const badge = tab === "buddies" ? requestCount : 0;
        return (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`chat-tab-${tab}`}
            aria-selected={selected}
            aria-controls={panelId}
            aria-label={
              badge > 0 ? `${label}, ${badge} ${badge === 1 ? "request" : "requests"}` : undefined
            }
            tabIndex={selected ? 0 : -1}
            onClick={(event) => onChange(event, tab)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {label}
            {badge > 0 && (
              <span className="qv-msg-tab-badge" aria-hidden="true">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ChatTabs;
