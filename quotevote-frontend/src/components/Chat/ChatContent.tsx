"use client";

import { useState } from "react";
import { Clock3, UserPlus, X } from "lucide-react";
import { useQuery } from "@apollo/client/react";

import ChatSearchInput from "./ChatSearchInput";
import MessageBox from "./MessageBox";
import ChatTabs from "./ChatTabs";
import ChatList from "./ChatList";
import BuddyListWithPresence from "@/components/BuddyList/BuddyListWithPresence";
import AddBuddyPanel from "./AddBuddyPanel";
import StatusEditor from "./StatusEditor";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useAppStore } from "@/store";
import { GET_BUDDY_REQUESTS } from "@/graphql/queries";
import { PRESENCE_LABEL, toPresenceStatus } from "@/lib/constants/presence";

type ChatTabValue = "chats" | "groups" | "buddies";

/** "Your status: Online · Reading the budget": opens the status editor (design). */
function UserStatusButton({ onClick }: { onClick: () => void }) {
  const userStatus = useAppStore((state) => state.chat.userStatus || "online");
  const userStatusMessage = useAppStore((state) => state.chat.userStatusMessage || "");
  const status = toPresenceStatus(userStatus);
  // Others see an invisible member as offline; the member sees their own choice.
  const own = userStatus === "invisible" ? "Invisible" : PRESENCE_LABEL[status];
  const label = `${own}${userStatusMessage ? ` · ${userStatusMessage}` : ""}`;

  return (
    <button type="button" className="qv-msg-status" onClick={onClick} title="Set status">
      <span className="qv-msg-status-dot" data-status={status} aria-hidden="true" />
      <span className="qv-msg-status-text">Your status: {label}</span>
    </button>
  );
}

interface BuddyRequestRow {
  _id: string;
  status?: string | null;
  requester?: { _id: string } | null;
}

function ChatContent() {
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const me = useAppStore((state) => state.user.data?._id) as string | undefined;

  const [search, setSearch] = useState("");
  const [addBuddyOpen, setAddBuddyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTabValue>("chats");
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);

  usePresenceHeartbeat();

  // The Buddies tab's badge: requests waiting for this member's answer.
  const { data: requestsData } = useQuery<{ buddyRequests?: BuddyRequestRow[] }>(
    GET_BUDDY_REQUESTS,
    {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    }
  );
  const incoming = (requestsData?.buddyRequests ?? []).filter(
    (r) => (r.status ?? "pending") === "pending" && r.requester?._id !== me
  ).length;

  const handleTabChange = (_: unknown, newValue: ChatTabValue) => {
    setActiveTab(newValue);
  };

  // Add Buddy is its own panel with its own field, separate from the search (#531).
  const handleAddBuddyClick = () => {
    setActiveTab("buddies");
    setAddBuddyOpen(true);
  };

  const searchPlaceholder =
    activeTab === "buddies"
      ? "Search buddies by name or @username"
      : "Search messages, @people or #tags";
  const searchLabel = activeTab === "buddies" ? "Search buddies" : "Search conversations";

  return (
    <div className="qv-msg" data-testid="chat-page" data-open={selectedRoomId ? "true" : undefined}>
      <section className="qv-msg-list" aria-label="Conversations">
        <div className="qv-msg-head">
          <div className="qv-msg-titles">
            <h2 className="qv-msg-title">Messages</h2>
            <UserStatusButton onClick={() => setStatusEditorOpen(true)} />
          </div>
          <button
            type="button"
            className="qv-msg-icon-btn"
            onClick={handleAddBuddyClick}
            aria-label="Add buddy"
            title="Add buddy"
          >
            <UserPlus className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="qv-msg-icon-btn"
            onClick={() => setStatusEditorOpen(true)}
            aria-label="Set status"
            title="Set status"
          >
            <Clock3 className="size-5" aria-hidden="true" />
          </button>
        </div>

        {addBuddyOpen ? (
          <AddBuddyPanel onBack={() => setAddBuddyOpen(false)} />
        ) : (
          <>
            <div className="qv-msg-tools">
              <ChatSearchInput
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder}
                ariaLabel={searchLabel}
              />
              <ChatTabs
                value={activeTab}
                onChange={handleTabChange}
                requestCount={incoming}
                panelId="chat-tabpanel"
              />
            </div>

            <div
              id="chat-tabpanel"
              role="tabpanel"
              aria-labelledby={`chat-tab-${activeTab}`}
              className="qv-msg-tabpanel"
            >
              {activeTab === "chats" && (
                <ChatList search={search} filterType="chats" onSearchChange={setSearch} />
              )}
              {activeTab === "groups" && (
                <ChatList search={search} filterType="groups" onSearchChange={setSearch} />
              )}
              {activeTab === "buddies" && <BuddyListWithPresence search={search} />}
            </div>
          </>
        )}
      </section>

      <section className="qv-msg-convo" aria-label="Conversation">
        {selectedRoomId ? (
          <MessageBox />
        ) : (
          <div className="qv-msg-empty">
            <button
              type="button"
              className="qv-msg-icon-btn qv-msg-empty-close"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <span className="qv-room-tile" data-tint="blue" aria-hidden="true">
              &ldquo;
            </span>
            <p className="qv-msg-empty-title">Pick a conversation</p>
            <p className="qv-msg-empty-text">
              Chats, discussions on posts and your buddies are on the left.
            </p>
          </div>
        )}
      </section>

      <StatusEditor open={statusEditorOpen} onClose={() => setStatusEditorOpen(false)} />
    </div>
  );
}

export default ChatContent;
