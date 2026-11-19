"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { useAppStore } from "@/store";
import { GET_BUDDY_LIST, GET_CHAT_ROOM, GET_FOLLOW_INFO, GET_USER } from "@/graphql/queries";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { FollowButton } from "@/components/CustomButtons/FollowButton";
import {
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
  getProfileBackgroundStyle,
} from "@/lib/utils/profileBackground";
import { NoFollowers } from "./NoFollowers";
import type {
  FollowInfoEntryData,
  FollowInfoProps,
  FollowRowProps,
  PresenceDotProps,
  ProfileMiniCardProps,
  ProfileUser,
  YourActivityProps,
} from "@/types/profile";
import type { StagedChatRoom } from "@/types/chat";

/* Followers and Following, from the approved design (Follow): the member's card on the
   left, the list with tabs in the middle, and the viewer's buddies and activity on the right. */

const PRESENCE: Record<string, { color: string; label: string }> = {
  online: { color: "#22c38e", label: "Online" },
  away: { color: "#f6c343", label: "Away" },
  dnd: { color: "#e5484d", label: "Do Not Disturb" },
};

function PresenceDot({ status, size = 12 }: PresenceDotProps) {
  const p = status ? PRESENCE[status] : undefined;
  if (!p) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -right-px -bottom-px rounded-full border-[2.5px] border-[var(--auth-surface)]"
      style={{ width: size, height: size, background: p.color }}
    />
  );
}

function FollowRow({ entry, isFollowing, isSelf }: FollowRowProps) {
  const presence = useAppStore((s) => s.chat.presenceMap?.[entry.id]);
  return (
    <div
      data-testid="user-follow-display"
      className="flex items-center gap-3.5 border-b border-[var(--inv-row-line)] px-[18px] py-3.5 last:border-b-0 hover:bg-[var(--auth-hover)]"
    >
      <Link
        href={`/profile/${entry.username}`}
        className="relative shrink-0"
        aria-hidden="true"
        tabIndex={-1}
      >
        <DisplayAvatar
          avatar={entry.avatar as string | Record<string, unknown> | undefined}
          username={entry.name || entry.username}
          size={44}
        />
        <PresenceDot status={presence?.status} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${entry.username}`}
          className="font-bold text-[var(--auth-ink)] no-underline hover:underline"
        >
          {entry.name || entry.username}
        </Link>
        <br />
        <span className="qv-auth-hint font-semibold">@{entry.username}</span>
      </div>
      {!isSelf && (
        <FollowButton
          design
          small
          isFollowing={isFollowing}
          profileUserId={entry.id}
          username={entry.username}
        />
      )}
    </div>
  );
}

function ProfileMiniCard({ user }: ProfileMiniCardProps) {
  const viewerId = useAppStore((s) => s.user.data?._id || s.user.data?.id);
  const presence = useAppStore((s) => s.chat.presenceMap?.[user._id]);
  const followers = user._followersId?.length ?? 0;
  const following = user._followingId?.length ?? 0;
  const isSelf = viewerId && String(viewerId) === String(user._id);
  const isFollowing = Boolean(viewerId && user._followersId?.includes(String(viewerId)));
  const setSelectedChatRoom = useAppStore((s) => s.setSelectedChatRoom);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const { data: roomData } = useQuery<{ messageRoom?: { _id: string } | null }>(GET_CHAT_ROOM, {
    variables: { otherUserId: user._id },
    fetchPolicy: "network-only",
    skip: !viewerId || Boolean(isSelf),
  });
  const openChat = () => {
    // Reuse the conversation if there is one, as the profile's Message button does.
    if (roomData?.messageRoom?._id) {
      setSelectedChatRoom(roomData.messageRoom._id);
      setChatOpen(true);
      return;
    }
    const staged: StagedChatRoom = {
      _id: null,
      title: user.name || user.username,
      avatar: typeof user.avatar === "string" ? user.avatar : null,
      messageType: "USER",
      users: [String(viewerId), user._id],
      recipientId: user._id,
      username: user.username,
    };
    setSelectedChatRoom(staged);
    setChatOpen(true);
  };
  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] shadow-[var(--inv-panel-shadow)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
      <div
        aria-hidden="true"
        className="h-[84px]"
        style={getProfileBackgroundStyle(DEFAULT_PROFILE_BG_COLOR, DEFAULT_PROFILE_BG_PATTERN, 28)}
      />
      <div className="flex flex-col gap-3 px-5 pb-5">
        <div className="relative -mt-10 w-fit rounded-full border-4 border-[var(--auth-surface)]">
          <DisplayAvatar
            avatar={user.avatar as string | Record<string, unknown> | undefined}
            username={user.name || user.username}
            size={72}
          />
          <PresenceDot status={presence?.status} size={18} />
        </div>
        <div>
          <b className="qv-auth-display text-[22px]! tracking-[-0.02em]!">
            {user.name || user.username}
          </b>
          <p className="mt-0.5 mb-0 text-[13.5px] font-semibold text-[var(--auth-muted)]">
            @{user.username}
          </p>
        </div>
        {user.bio && (
          <p className="m-0 text-sm leading-[1.55]! text-[var(--auth-ink-2)]">{user.bio}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="qv-pub-tint-blue rounded-[12px] px-3 py-2.5">
            <b className="text-lg">{followers}</b>
            <br />
            <span className="qv-auth-hint font-bold">Followers</span>
          </div>
          <div className="qv-pub-tint-green rounded-[12px] px-3 py-2.5">
            <b className="text-lg">{following}</b>
            <br />
            <span className="qv-auth-hint font-bold">Following</span>
          </div>
        </div>
        {!isSelf && viewerId && (
          <div className="flex gap-2">
            <FollowButton
              design
              small
              isFollowing={isFollowing}
              profileUserId={user._id}
              username={user.username}
              className="flex-1"
            />
            <button type="button" onClick={openChat} className="qv-auth-btn qv-auth-btn-sm flex-1">
              Message
            </button>
          </div>
        )}
        <Link
          href={`/profile/${user.username}`}
          className="qv-auth-link w-fit text-[13px] font-bold"
        >
          View profile →
        </Link>
      </div>
    </section>
  );
}

function Buddies() {
  const presenceMap = useAppStore((s) => s.chat.presenceMap);
  const { data } = useQuery<{
    getBuddyList?: Array<{
      user: { _id: string; name?: string; username: string; avatar?: unknown };
      presence?: { status?: string } | null;
    }>;
  }>(GET_BUDDY_LIST, { errorPolicy: "all" });
  const buddies = (data?.getBuddyList ?? []).slice(0, 5);
  return (
    <section className="rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] p-[18px] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="qv-inv-sec-title m-0!">Buddies</h2>
        <Link href="/messages" className="qv-auth-link text-[12.5px] font-bold">
          Open messages
        </Link>
      </div>
      {buddies.length === 0 ? (
        <p className="qv-auth-hint m-0 py-1.5">No buddies yet.</p>
      ) : (
        buddies.map(({ user, presence }) => {
          const live = presenceMap?.[user._id];
          const status = live?.status || presence?.status || "offline";
          const label = PRESENCE[status]?.label ?? "Offline";
          const message = live?.statusMessage;
          return (
            <Link
              key={user._id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-2.5 rounded-lg px-0.5 py-[7px] text-[var(--auth-ink)] no-underline hover:bg-[var(--auth-hover)]"
            >
              <span className="relative shrink-0">
                <DisplayAvatar
                  avatar={user.avatar as string | Record<string, unknown> | undefined}
                  username={user.name || user.username}
                  size={36}
                />
                <PresenceDot status={status} />
              </span>
              <span className="min-w-0 flex-1 text-[13.5px] leading-snug">
                <b>{user.name || user.username}</b>
                <br />
                <span className="qv-auth-hint">
                  {message && status === "away" ? `${label} · ${message}` : label}
                </span>
              </span>
            </Link>
          );
        })
      )}
    </section>
  );
}

function YourActivity({ username }: YourActivityProps) {
  const { data } = useQuery<{ user?: ProfileUser | null }>(GET_USER, {
    variables: { username },
    skip: !username,
    errorPolicy: "all",
  });
  const m = data?.user?.reputation?.metrics;
  const rows: [string, string, number | undefined][] = [
    ["Posts created", "#56b3ff", m?.totalPosts],
    ["Upvotes given", "#52b274", m?.totalUpvotes],
    ["Comments made", "#fdd835", m?.totalComments],
  ];
  return (
    <section className="rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] p-[18px] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
      <h2 className="qv-inv-sec-title mb-2.5!">Your activity</h2>
      {rows.map(([label, color, value], i) => (
        <div
          key={label}
          className={`flex justify-between px-0.5 py-2 text-[13.5px] font-semibold ${i < rows.length - 1 ? "border-b border-[var(--inv-row-line)]" : ""}`}
        >
          <span className="flex items-center gap-2">
            <span
              className="qv-inv-dot size-2!"
              style={{ ["--light" as string]: color }}
              aria-hidden="true"
            />
            {label}
          </span>
          <b>{value ?? 0}</b>
        </div>
      ))}
    </section>
  );
}

export function FollowInfo({ filter }: FollowInfoProps) {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const viewer = useAppStore((s) => s.user.data) as {
    _id?: string;
    id?: string;
    username?: string;
    _followingId?: string | string[];
  };
  const viewerId = String(viewer?._id || viewer?.id || "");

  const { data, error, loading } = useQuery<{ getUserFollowInfo?: FollowInfoEntryData[] }>(
    GET_FOLLOW_INFO,
    {
      variables: { username, filter },
      skip: !username,
    }
  );
  const { data: profileData } = useQuery<{ user?: ProfileUser | null }>(GET_USER, {
    variables: { username },
    skip: !username,
    errorPolicy: "all",
  });
  const profile = profileData?.user ?? null;

  if (loading) return <LoadingSpinner />;
  if (error) return <div role="alert">Error: {error.message}</div>;

  const list = data?.getUserFollowInfo ?? [];
  const followingIds = Array.isArray(viewer?._followingId)
    ? viewer._followingId
    : typeof viewer?._followingId === "string"
      ? [viewer._followingId]
      : [];
  const counts = {
    followers: filter === "followers" ? list.length : (profile?._followersId?.length ?? 0),
    following: filter === "following" ? list.length : (profile?._followingId?.length ?? 0),
  };
  const title = filter === "followers" ? `${list.length} Followers` : `${list.length} Following`;
  const tab = (key: "followers" | "following", label: string) => (
    <Link
      href={`/profile/${username}/${key}`}
      aria-current={filter === key ? "page" : undefined}
      className="inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-bold text-[var(--auth-ink-2)] no-underline aria-[current=page]:bg-[var(--auth-surface)] aria-[current=page]:text-[var(--auth-ink)] aria-[current=page]:shadow-[0_1px_2px_rgba(15,23,42,0.1)] [.neo-brutalism_&]:rounded-[4px]"
    >
      {label}
      <span
        className={`inline-flex h-[22px] min-w-6 items-center justify-center rounded-[11px] px-[7px] text-xs ${filter === key ? "bg-[var(--inv-count-on)] text-[var(--inv-count-on-ink)]" : "bg-[var(--inv-count)]"}`}
      >
        {counts[key]}
      </span>
    </Link>
  );

  return (
    <div
      id="component-followers-display"
      className="qv-auth qv-pub min-h-[calc(100dvh-var(--app-header-h))] bg-[var(--inv-ground)]! font-redesign"
    >
      <div className="mx-auto grid w-full max-w-[1376px] grid-cols-1 gap-6 px-4 pt-6 pb-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-9 lg:pt-8 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:px-0">
        <aside aria-label="Profile" className="max-lg:hidden">
          {profile && <ProfileMiniCard user={profile} />}
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 text-[13.5px] font-bold text-[var(--auth-muted)] hover:underline"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Go Back
          </button>
          <h1 className="qv-auth-display m-0 text-[30px]! lg:text-[36px]!">{title}</h1>
          <nav
            aria-label="Followers and following"
            className="flex w-fit gap-1 rounded-[14px] bg-[var(--inv-track)] p-1 [.neo-brutalism_&]:rounded-[4px]"
          >
            {tab("followers", "Followers")}
            {tab("following", "Following")}
          </nav>
          {list.length === 0 ? (
            <NoFollowers filter={filter} />
          ) : (
            <section
              id="component-follows-list"
              className="overflow-hidden rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] shadow-[var(--inv-panel-shadow)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2"
            >
              {list.map((entry) => (
                <FollowRow
                  key={entry.id}
                  entry={entry}
                  isFollowing={followingIds.includes(entry.id)}
                  isSelf={entry.id === viewerId}
                />
              ))}
            </section>
          )}
        </main>

        {viewerId && (
          <aside aria-label="Highlights" className="flex flex-col gap-4 max-xl:hidden">
            <Buddies />
            <YourActivity username={viewer?.username ?? ""} />
          </aside>
        )}
      </div>
    </div>
  );
}
