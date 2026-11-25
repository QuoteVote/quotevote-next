"use client";

import { useMemo, useState, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { includes } from "lodash";
import moment from "moment";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type { Reference } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Link2,
  ExternalLink,
  Ban,
  Trash2,
  ChevronLeft,
  Hash,
  MoreHorizontal,
  MessageCircle,
  Highlighter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { FollowButton } from "@/components/CustomButtons/FollowButton";
import { BookmarkIconButton } from "@/components/CustomButtons/BookmarkIconButton";
import { ApproveButton } from "@/components/CustomButtons/ApproveButton";
import { RejectButton } from "@/components/CustomButtons/RejectButton";
import {
  REPORT_POST,
  VOTE,
  APPROVE_POST,
  REJECT_POST,
  DELETE_POST,
  DELETE_VOTE,
} from "@/graphql/mutations";
import { GET_POST, GET_TAG, GET_TOP_POSTS, GET_USERS } from "@/graphql/queries";
import useGuestGuard from "@/hooks/useGuestGuard";
import { POST_ACTION_NEUTRAL_CLASS, POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { VOTE_AXIS, VOTE_LABELS } from "@/lib/constants/voteAxes";
import { cn } from "@/lib/utils";
import { scrollActionIntoDiscussion } from "@/lib/utils/discussionSplit";
import { buildPassageActivity } from "@/lib/utils/passageActivity";
import { getDomain, sanitizeUrl, toAbsolutePostUrl } from "@/lib/utils/sanitizeUrl";
import { useAppStore } from "@/store";
import VotingBoard from "@/components/VotingComponents/VotingBoard";
const VotingPopup = lazy(() => import("@/components/VotingComponents/VotingPopup"));
import type { PostVote, PostProps } from "@/types/post";
import type {
  PassageActivitySegment,
  SelectedText,
  UserVote,
  VoteType,
  VoteOption,
} from "@/types/voting";

type VoteStateMutationPost = {
  _id: string;
  approvedBy?: string[];
  rejectedBy?: string[];
};

export default function Post({
  post,
  user,
  postHeight,
  postActions: _postActions,
  refetchPost,
  onOpenDiscussion,
  onActivateLinkedComment,
}: PostProps) {
  const router = useRouter();
  const ensureAuth = useGuestGuard();
  const linkedPassage = useAppStore((state) => state.ui.linkedPassage);
  const mobileDiscussionOpen = useAppStore((state) => state.ui.mobileDiscussionOpen);
  const setPendingQuote = useAppStore((state) => state.setPendingQuote);
  const setLinkedPassage = useAppStore((state) => state.setLinkedPassage);

  // Passages that already have votes, quotes or passage comments (#548).
  const passageActivity = useMemo(
    () =>
      buildPassageActivity(post.text || "", {
        votes: post.votes,
        quotes: post.quotes,
        comments: post.comments,
      }),
    [post.text, post.votes, post.quotes, post.comments]
  );

  const openInDiscussion = (actionId: string) => {
    onActivateLinkedComment?.(actionId);
    // Reverse-nav only when opening Discussion; tapping the highlight while
    // split-screen is already open clears the selection instead.
    if (mobileDiscussionOpen) return;
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        scrollActionIntoDiscussion(actionId, "center");
      }, 220);
    });
  };

  const handleHighlightClick = () => {
    const actionId = linkedPassage?.actionId;
    if (!actionId) {
      onOpenDiscussion?.();
      return;
    }
    openInDiscussion(actionId);
  };

  // A marked passage becomes the linked passage and opens its newest activity.
  const handleActivityClick = (segment: PassageActivitySegment) => {
    const actionId = segment.actionIds[0];
    if (!actionId) return;
    setLinkedPassage({ actionId, startWordIndex: segment.start, endWordIndex: segment.end });
    openInDiscussion(actionId);
  };

  const { title, creator, created, _id, userId } = post;
  const { name, avatar, username } = creator || {};
  const { _followingId = [] } = user;

  const isFollowing = includes(_followingId, userId);
  const admin = user.admin || false;
  const isOwner = user._id === userId;

  // Admin-only: fetch user list for enhanced tooltips
  useQuery<{ users?: Array<{ _id: string; username: string }> }>(GET_USERS, {
    skip: !admin,
    errorPolicy: "all",
  });

  // Post has no nested tag field; cache-first reuses GET_TAG (also used by PostCard)
  // so the same tag does not refetch on re-render or return visits in this session.
  const { data: tagData } = useQuery<{ tag?: { _id: string; title: string } | null }>(GET_TAG, {
    variables: { tagId: post.tagId || "" },
    skip: !post.tagId,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });

  const [addVote] = useMutation<{ addVote?: { _id?: string | null } | null }>(VOTE, {
    update() {
      refetchPost?.();
    },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: "" } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  });

  const [removeVote] = useMutation(DELETE_VOTE, {
    update() {
      refetchPost?.();
    },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: "" } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  });

  const [reportPost] = useMutation<{ reportPost: { _id: string; reportedBy: string[] } }>(
    REPORT_POST,
    {
      refetchQueries: [
        { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: "" } },
        { query: GET_POST, variables: { postId: _id } },
      ],
    }
  );

  const [approvePost] = useMutation<{ approvePost?: VoteStateMutationPost }>(APPROVE_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: "", interactions: false },
      },
    ],
  });

  const [rejectPost] = useMutation<{ rejectPost?: VoteStateMutationPost }>(REJECT_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: "", interactions: false },
      },
    ],
  });

  const [deletePost] = useMutation<{ deletePost: { _id: string } }>(DELETE_POST, {
    update(cache, { data }) {
      if (!data?.deletePost) return;
      const deletedId = data.deletePost._id;
      cache.modify({
        fields: {
          posts(existing: unknown = {}, { readField }) {
            const obj = existing as { entities?: Reference[] };
            if (!obj.entities) return existing;
            return {
              ...obj,
              entities: obj.entities.filter((ref) => readField("_id", ref) !== deletedId),
            };
          },
          featuredPosts(existing: unknown = {}, { readField }) {
            const obj = existing as { entities?: Reference[] };
            if (!obj.entities) return existing;
            return {
              ...obj,
              entities: obj.entities.filter((ref) => readField("_id", ref) !== deletedId),
            };
          },
        },
      });
      cache.evict({ id: cache.identify({ __typename: "Post", _id: deletedId }) });
      cache.gc();
    },
    refetchQueries: [
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: "", interactions: false },
      },
    ],
  });

  const userIdStr = user._id?.toString();
  const [localApprovedBy, setLocalApprovedBy] = useState<string[]>(() => post.approvedBy || []);
  const [localRejectedBy, setLocalRejectedBy] = useState<string[]>(() => post.rejectedBy || []);
  const [prevApprovedBy, setPrevApprovedBy] = useState(post.approvedBy);
  const [prevRejectedBy, setPrevRejectedBy] = useState(post.rejectedBy);
  const [showHighlights, setShowHighlights] = useState(false);
  const [prevPostId, setPrevPostId] = useState(post._id);
  if (prevPostId !== post._id) {
    setPrevPostId(post._id);
    setShowHighlights(false);
  }
  if (prevApprovedBy !== post.approvedBy) {
    setPrevApprovedBy(post.approvedBy);
    setLocalApprovedBy(post.approvedBy || []);
  }
  if (prevRejectedBy !== post.rejectedBy) {
    setPrevRejectedBy(post.rejectedBy);
    setLocalRejectedBy(post.rejectedBy || []);
  }

  const hasApproved =
    Array.isArray(localApprovedBy) && localApprovedBy.some((id) => id?.toString() === userIdStr);
  const hasRejected =
    Array.isArray(localRejectedBy) && localRejectedBy.some((id) => id?.toString() === userIdStr);
  const votedBy = (post.votes || []) as PostVote[];

  // The current user's votes on exactly this passage (several responses can be active).
  const getPassageVotes = (passage: SelectedText): UserVote[] =>
    votedBy.flatMap((v) => {
      if (v.user?._id?.toString() !== userIdStr) return [];
      if ((v as { deleted?: boolean }).deleted || !v._id || !v.type) return [];
      if (v.startWordIndex !== passage.startIndex || v.endWordIndex !== passage.endIndex) return [];
      // The API returns `tags` as a String even though PostVote types it as string[].
      const rawTags: unknown = v.tags;
      const tags = Array.isArray(rawTags) ? rawTags[0] : rawTags;
      return [
        { _id: v._id, type: v.type as VoteType, tags: typeof tags === "string" ? tags : null },
      ];
    });

  // GraphQL errors (for example the live API's one-vote-per-post rule, #542) are already
  // shown by the global Apollo error link, so only report the other failures here.
  const reportVoteError = (prefix: string, err: unknown) => {
    if (CombinedGraphQLErrors.is(err)) return;
    toast.error(`${prefix}: ${err instanceof Error ? err.message : "Unknown"}`);
  };

  const handleRemoveVote = async (voteId: string) => {
    if (!ensureAuth()) return;
    try {
      await removeVote({ variables: { voteId } });
      toast.success("Vote removed");
    } catch (err) {
      reportVoteError("Error removing vote", err);
    }
  };

  const handleVoting = async (obj: { type: VoteType; tags: VoteOption }, passage: SelectedText) => {
    if (!ensureAuth()) return;
    // One response per pair on a passage: the other side of the same pair is replaced,
    // responses in the other pairs are kept.
    const opposite = getPassageVotes(passage).find(
      (v) =>
        v.tags !== obj.tags && v.tags && VOTE_AXIS[v.tags as VoteOption] === VOTE_AXIS[obj.tags]
    );
    try {
      if (opposite) {
        await removeVote({ variables: { voteId: opposite._id } });
      }
      const res = await addVote({ variables: { vote: passageVote(passage, obj) } });
      const voteId = res.data?.addVote?._id;
      toast.success(`Vote saved: ${VOTE_LABELS[obj.tags]}`, {
        duration: 8000,
        action: voteId
          ? { label: "Undo", onClick: () => void undoVote(voteId, passage, opposite) }
          : undefined,
      });
    } catch (err) {
      reportVoteError("Vote error", err);
    }
  };

  const passageVote = (passage: SelectedText, choice: { type: VoteType; tags: VoteOption }) => ({
    content: passage.text || "",
    postId: post._id,
    userId: user._id,
    type: choice.type,
    tags: choice.tags,
    startWordIndex: passage.startIndex,
    endWordIndex: passage.endIndex,
  });

  // Removes the new vote and, if it replaced the other side of a pair, puts that response back.
  const undoVote = async (voteId: string, passage: SelectedText, replaced?: UserVote) => {
    try {
      await removeVote({ variables: { voteId } });
      if (replaced?.tags) {
        await addVote({
          variables: {
            vote: passageVote(passage, { type: replaced.type, tags: replaced.tags as VoteOption }),
          },
        });
      }
      toast.success(
        replaced?.tags
          ? `Vote undone, ${VOTE_LABELS[replaced.tags as VoteOption]} is back`
          : "Vote undone"
      );
    } catch (err) {
      reportVoteError("Couldn't undo the vote", err);
    }
  };

  const handleQuote = (selection: SelectedText) => {
    if (!ensureAuth()) return;
    setPendingQuote({
      postId: _id,
      text: selection.text,
      startIndex: selection.startIndex,
      endIndex: selection.endIndex,
    });
    onOpenDiscussion?.();
  };

  const handleApprove = async () => {
    if (!ensureAuth()) return;
    if (!userIdStr) return;
    const removing = hasApproved;
    if (removing) {
      setLocalApprovedBy((prev) => prev.filter((id) => id.toString() !== userIdStr));
    } else {
      setLocalApprovedBy((prev) =>
        prev.some((id) => id.toString() === userIdStr) ? prev : [...prev, userIdStr]
      );
      setLocalRejectedBy((prev) => prev.filter((id) => id.toString() !== userIdStr));
    }
    try {
      const { data } = await approvePost({
        variables: { postId: _id, userId: user._id, remove: removing },
      });
      const updated = data?.approvePost;
      if (updated) {
        setLocalApprovedBy(updated.approvedBy || []);
        setLocalRejectedBy(updated.rejectedBy || []);
      }
      toast.success(removing ? "Approval removed" : "Post approved");
    } catch (err) {
      setLocalApprovedBy(post.approvedBy || []);
      setLocalRejectedBy(post.rejectedBy || []);
      toast.error(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  const handleReject = async () => {
    if (!ensureAuth()) return;
    if (!userIdStr) return;
    const removing = hasRejected;
    if (removing) {
      setLocalRejectedBy((prev) => prev.filter((id) => id.toString() !== userIdStr));
    } else {
      setLocalRejectedBy((prev) =>
        prev.some((id) => id.toString() === userIdStr) ? prev : [...prev, userIdStr]
      );
      setLocalApprovedBy((prev) => prev.filter((id) => id.toString() !== userIdStr));
    }
    try {
      const { data } = await rejectPost({
        variables: { postId: _id, userId: user._id, remove: removing },
      });
      const updated = data?.rejectPost;
      if (updated) {
        setLocalApprovedBy(updated.approvedBy || []);
        setLocalRejectedBy(updated.rejectedBy || []);
      }
      toast.success(removing ? "Rejection removed" : "Post rejected");
    } catch (err) {
      setLocalApprovedBy(post.approvedBy || []);
      setLocalRejectedBy(post.rejectedBy || []);
      toast.error(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  const handleReport = async () => {
    if (!ensureAuth()) return;
    try {
      const res = await reportPost({ variables: { postId: _id, userId: user._id } });
      toast.success(`Post reported (${res.data?.reportPost?.reportedBy?.length || 1} total)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost({ variables: { postId: _id } });
      toast.success("Post deleted");
      router.push("/");
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  const handleCopy = async () => {
    const url =
      toAbsolutePostUrl(post.url) ??
      toAbsolutePostUrl(typeof window !== "undefined" ? window.location.pathname : "");
    if (!url) {
      toast.error("Unable to copy link — this post has no shareable URL");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const approveCount = localApprovedBy.length;
  const rejectCount = localRejectedBy.length;
  const discussionCount = post.comments?.length || 0;
  const citationHref = post.citationUrl ? sanitizeUrl(post.citationUrl) : null;
  const citationDomain = citationHref ? getDomain(citationHref) : null;
  const communityTitle = tagData?.tag?.title;

  return (
    <div
      className="flex min-h-full flex-col bg-[var(--shell-surface)]"
      role="article"
      aria-label={title || "Post"}
    >
      {/* ── Header: back link, author, topic and source, title ── */}
      <div className="font-redesign flex flex-col gap-4 px-4 pt-5 pb-1 sm:px-6 lg:pt-8 lg:pr-14 lg:pl-[88px]">
        <Link
          href="/"
          className="hidden items-center gap-1.5 self-start text-[13.5px] font-bold text-[var(--shell-muted)] hover:text-[var(--shell-ink)] md:inline-flex"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to quotes
        </Link>

        {/* Author row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <button
            type="button"
            onClick={() => username && router.push(`/profile/${username}`)}
            className="shrink-0 rounded-full overflow-hidden"
            aria-label={name || username ? `${name || username}'s profile` : "Author profile"}
          >
            <DisplayAvatar
              avatar={avatar as string | Record<string, unknown> | undefined}
              /* Seed the default avatar with the same value the profile/chat
                 use (display name, falling back to username) so an unset
                 avatar looks identical across the post, profile and messages. */
              username={name || username || undefined}
              size={44}
              className="size-11"
            />
          </button>
          <div className="flex min-w-0 flex-1 flex-col md:flex-none">
            <button
              type="button"
              onClick={() => username && router.push(`/profile/${username}`)}
              className="truncate text-left text-[15.5px] font-extrabold leading-tight text-[var(--shell-ink)] hover:underline"
            >
              {name || username}
            </button>
            <span className="truncate text-[13px] font-semibold text-[var(--shell-muted)]">
              {username ? `@${username} · ` : ""}
              <time dateTime={created} suppressHydrationWarning>
                {moment(created).format("MMM D, YYYY · h:mm A")}
              </time>
            </span>
          </div>
          {!isOwner && (
            <FollowButton
              isFollowing={isFollowing}
              profileUserId={userId}
              username={username || ""}
              className="h-9 shrink-0 rounded-[10px] px-[13px] text-[13px] font-bold md:ml-1"
            />
          )}

          {/* Topic and source */}
          {communityTitle || (citationHref && citationDomain) ? (
            <div
              data-testid="post-metadata"
              className="flex basis-full flex-wrap items-center gap-1.5 md:ml-auto md:basis-auto"
            >
              {communityTitle ? (
                <button
                  type="button"
                  aria-label={`Filter by #${communityTitle}`}
                  onClick={() => router.push(`/?tag=${post.tagId}`)}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full bg-[var(--shell-green-soft)] px-[11px] text-[12.5px] font-bold text-[var(--shell-green)] transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]/50"
                >
                  <Hash className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                  {communityTitle}
                </button>
              ) : null}
              {citationHref && citationDomain ? (
                <a
                  href={citationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Source: ${citationDomain} (opens in a new tab)`}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--shell-key-line)] bg-[var(--shell-surface)] px-[11px] text-[12.5px] font-semibold text-[var(--shell-ink-2)] transition-colors hover:bg-[var(--shell-hover)]"
                >
                  <span>Source: {citationDomain}</span>
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Title */}
        <h1
          data-testid="post-detail-title"
          className="max-w-[720px] text-[32px]! leading-[1.08]! font-extrabold! tracking-[-0.03em]! text-[var(--shell-ink)] md:text-[46px]!"
        >
          {title}
        </h1>
      </div>

      {/* ── Action bar ── */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 pt-4 pb-3 sm:px-6 lg:pr-14 lg:pl-[88px]",
          mobileDiscussionOpen
            ? "relative bg-[var(--shell-surface)]"
            : "sticky top-0 z-10 bg-[var(--shell-surface)]"
        )}
        role="toolbar"
        aria-label="Post actions"
      >
        {/* Wraps instead of scrolling with a hidden scrollbar, so More options is never cut off in a narrow post pane (#516). */}
        <div className="flex flex-wrap items-center gap-2">
          <RejectButton
            selected={hasRejected}
            count={rejectCount}
            onClick={handleReject}
            aria-label={hasRejected ? "Remove rejection" : "Reject this post"}
          />
          <ApproveButton
            selected={hasApproved}
            count={approveCount}
            onClick={handleApprove}
            aria-label={hasApproved ? "Remove approval" : "Approve this post"}
          />

          <span
            className="mx-1 hidden h-7 w-px bg-[var(--shell-key-line)] sm:block"
            aria-hidden="true"
          />

          <BookmarkIconButton
            post={{ _id: post._id, bookmarkedBy: post.bookmarkedBy || undefined }}
            user={{ _id: user._id || "" }}
            showLabel
          />

          {onOpenDiscussion ? (
            <button
              type="button"
              onClick={onOpenDiscussion}
              // Phones open Discussion from the bar at the bottom instead.
              className={cn(
                POST_ACTION_PILL_CLASS,
                POST_ACTION_NEUTRAL_CLASS,
                "hidden items-center gap-2 transition-colors shrink-0 sm:inline-flex"
              )}
              aria-label={`${discussionCount} comment${discussionCount !== 1 ? "s" : ""}`}
              data-testid="post-comment-count"
            >
              <MessageCircle className="size-4" />
              <span className="tabular-nums font-bold">{discussionCount}</span>
            </button>
          ) : (
            <span
              className={cn(
                POST_ACTION_PILL_CLASS,
                POST_ACTION_NEUTRAL_CLASS,
                "inline-flex items-center gap-2 shrink-0"
              )}
              aria-label={`${discussionCount} comment${discussionCount !== 1 ? "s" : ""}`}
              data-testid="post-comment-count"
            >
              <MessageCircle className="size-4" />
              <span className="tabular-nums font-bold">{discussionCount}</span>
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  POST_ACTION_PILL_CLASS,
                  POST_ACTION_NEUTRAL_CLASS,
                  "w-10 shrink-0 px-0 sm:w-11 sm:px-0"
                )}
                aria-label="More options"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleCopy}>
                <Link2 className="size-4 mr-2" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleReport}
                className="text-destructive focus:text-destructive"
              >
                <Ban className="size-4 mr-2" /> Report post
              </DropdownMenuItem>
              {(isOwner || admin) && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" /> Delete post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowHighlights((prev) => !prev)}
            aria-pressed={showHighlights}
            aria-label={showHighlights ? "Hide highlights" : "Show highlights"}
            title={showHighlights ? "Hide highlights" : "Show highlights"}
            className={cn(
              POST_ACTION_PILL_CLASS,
              "w-10 shrink-0 px-0 sm:w-11 sm:px-0 transition-colors",
              showHighlights
                ? "border-[var(--shell-primary-line)] bg-[var(--shell-primary)] text-[var(--shell-primary-ink)] hover:bg-[var(--shell-primary-hover)] hover:text-[var(--shell-primary-ink)]"
                : POST_ACTION_NEUTRAL_CLASS
            )}
            data-testid="toggle-highlights"
          >
            <Highlighter className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── Post body ───────────────────────────────────────────────────── */}
      <div className="font-redesign px-4 py-4 sm:px-6 lg:pr-14 lg:pl-[88px]">
        {/* Selectable post text + floating VotingPopup */}
        {showHighlights && passageActivity.length > 0 && (
          <p
            data-testid="passage-activity-hint"
            className="mb-4 max-w-[700px] text-[13px]! leading-normal! font-semibold text-[var(--shell-muted)] sm:text-[13.5px]!"
          >
            Highlighted passages already have votes or comments. Select one to see them in
            Discussion, or select any words to respond.
          </p>
        )}

        <div
          data-testid="post-detail-body"
          className={cn(
            "max-w-[700px] text-[19px] leading-[1.75] font-medium text-[var(--shell-ink)] md:text-[22px] md:leading-[1.85]",
            postHeight && postHeight >= 742 && "max-h-[60vh] overflow-y-auto"
          )}
        >
          <VotingBoard
            content={post.text || ""}
            highlights={showHighlights}
            votes={post.votes || []}
            focusedComment={linkedPassage}
            onHighlightClick={handleHighlightClick}
            activity={passageActivity}
            onActivityClick={handleActivityClick}
          >
            {(selection, { dismiss, sheet }) => (
              <Suspense fallback={null}>
                <VotingPopup
                  variant={sheet ? "sheet" : "popover"}
                  onVote={(vote) => handleVoting(vote, selection)}
                  onQuote={handleQuote}
                  selectedText={selection}
                  userVotes={getPassageVotes(selection)}
                  onRemoveVote={handleRemoveVote}
                  onDismiss={dismiss}
                />
              </Suspense>
            )}
          </VotingBoard>
        </div>
      </div>
    </div>
  );
}
