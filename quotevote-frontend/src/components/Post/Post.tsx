"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { includes } from "lodash";
import moment from "moment";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type { Reference } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Link2, ExternalLink, Ban, Trash2, Hash ,MessageCircle, MoreHorizontal /* ... other icons */ } from "lucide-react";
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
import { GET_GROUP, GET_POST, GET_TOP_POSTS, GET_USERS } from "@/graphql/queries";
import useGuestGuard from "@/hooks/useGuestGuard";
import { POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { VOTE_AXIS } from "@/lib/constants/voteAxes";
import { cn } from "@/lib/utils";
import { scrollActionIntoDiscussion } from "@/lib/utils/discussionSplit";
import { getDomain, sanitizeUrl, toAbsolutePostUrl } from "@/lib/utils/sanitizeUrl";
import { useAppStore } from "@/store";
import VotingBoard from "@/components/VotingComponents/VotingBoard";
const VotingPopup = lazy(() => import("@/components/VotingComponents/VotingPopup"));
import type { PostVote, PostProps } from "@/types/post";
import type { SelectedText, UserVote, VoteType, VoteOption } from "@/types/voting";


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

  const handleHighlightClick = () => {
    const actionId = linkedPassage?.actionId;
    if (!actionId) {
      onOpenDiscussion?.();
      return;
    }
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

  // Post has no nested `group` field; cache-first reuses GET_GROUP (also used by PostCard)
  // so the same groupId does not refetch on re-render or return visits in this session.
  const { data: groupData } = useQuery<{ group?: { _id: string; title: string } }>(GET_GROUP, {
    variables: { groupId: post.groupId || "" },
    skip: !post.groupId,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });

  const [addVote] = useMutation(VOTE, {
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
      await addVote({
        variables: {
          vote: {
            content: passage.text || "",
            postId: post._id,
            userId: user._id,
            type: obj.type,
            tags: obj.tags,
            startWordIndex: passage.startIndex,
            endWordIndex: passage.endIndex,
          },
        },
      });
      toast.success("Voted successfully");
    } catch (err) {
      reportVoteError("Vote error", err);
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
  const communityTitle = groupData?.group?.title;

  return (
    <div className="flex flex-col" role="article" aria-label={title || "Post"}>
      {/* ── Non-sticky header area ──────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => username && router.push(`/profile/${username}`)}
            className="shrink-0 rounded-full overflow-hidden"
          >
            <DisplayAvatar
              avatar={avatar as string | Record<string, unknown> | undefined}
              /* Seed the default avatar with the same value the profile/chat
                 use (display name, falling back to username) so an unset
                 avatar looks identical across the post, profile and messages. */
              username={name || username || undefined}
              size={56}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => username && router.push(`/profile/${username}`)}
                className="text-lg font-bold text-foreground leading-none hover:underline"
              >
                {name || username}
              </button>
              {!isOwner && (
                <FollowButton
                  isFollowing={isFollowing}
                  profileUserId={userId}
                  username={username || ""}
                  followingLabel="Following"
                  buttonVariant="outline"
                  className="h-8 rounded-full px-4 text-sm font-semibold border-blue-300 text-blue-600 bg-background shadow-none hover:bg-blue-50 hover:text-blue-700 dark:border-blue-400/50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                />
              )}
            </div>
            {username ? (
              <p className="mt-1 text-sm text-muted-foreground truncate">@{username}</p>
            ) : null}
          </div>
        </div>

        {/* Post metadata: community, source, timestamp */}
        <div data-testid="post-metadata" className="flex items-center gap-2.5 flex-wrap mb-5">
          {communityTitle ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Hash className="size-3.5 stroke-[2.5]" />
              {communityTitle}
            </span>
          ) : null}
          {communityTitle && citationDomain ? (
            <span className="text-border select-none" aria-hidden>
              |
            </span>
          ) : null}
          {citationHref && citationDomain ? (
            <a
              href={citationHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Source: ${citationDomain} (opens in a new tab)`}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-950/70"
            >
              <span>Source: {citationDomain}</span>
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          ) : null}
          <div className="ml-auto flex items-center gap-2.5 shrink-0">
            {(communityTitle || citationDomain) && (
              <span className="text-border select-none" aria-hidden>
                |
              </span>
            )}
            <time
              className="text-right text-[13px] text-muted-foreground leading-tight"
              dateTime={created}
              suppressHydrationWarning
            >
              <span className="block">{moment(created).format("MMM D, YYYY")}</span>
              <span className="block">{moment(created).format("h:mm A")}</span>
            </time>
          </div>
        </div>

        {/* Title */}
        <h1
          data-testid="post-detail-title"
          className="text-[1.75rem] sm:text-[2rem] font-extrabold text-foreground leading-[1.15] tracking-[-0.02em] mb-1"
        >
          {title}
        </h1>
      </div>

      {/* ── Action bar ── */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 sm:px-6 pt-4 pb-4",
          mobileDiscussionOpen ? "relative bg-background" : "sticky top-0 z-10 bg-background"
        )}
        role="toolbar"
        aria-label="Post actions"
      >
        <div className="flex items-center gap-1.5 flex-nowrap [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden">
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

          <span className="text-border px-0.5 select-none" aria-hidden>
            |
          </span>

          <BookmarkIconButton
            post={{ _id: post._id, bookmarkedBy: post.bookmarkedBy || undefined }}
            user={{ _id: user._id || "" }}
            showLabel
          />

          {onOpenDiscussion ? (
            <button
              type="button"
              onClick={onOpenDiscussion}
              className={cn(
                POST_ACTION_PILL_CLASS,
                "inline-flex items-center gap-1 border border-border bg-background text-muted-foreground hover:bg-muted/70 transition-colors shrink-0"
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
                "inline-flex items-center gap-1 border border-border bg-background text-muted-foreground shrink-0"
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
                className="size-8 rounded-full text-muted-foreground border-border bg-background shadow-none shrink-0"
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
        </div>
      </div>

      {/* ── Post body ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4">
        {/* Selectable post text + floating VotingPopup */}

        <div
          data-testid="post-detail-body"
          className={cn(
            "text-[16px] leading-[1.7] text-foreground/85",
            postHeight && postHeight >= 742 && "max-h-[60vh] overflow-y-auto"
          )}
        >
          <VotingBoard
            content={post.text || ""}
            highlights={true}
            votes={post.votes || []}
            focusedComment={linkedPassage}
            onHighlightClick={handleHighlightClick}
          >
            {(selection, { dismiss }) => (
              <Suspense fallback={null}>
                <VotingPopup
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
