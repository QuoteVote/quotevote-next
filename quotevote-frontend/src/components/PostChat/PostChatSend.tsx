"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store";
import { ADD_COMMENT, ADD_QUOTE, SEND_MESSAGE } from "@/graphql/mutations";
import { GET_POST, GET_ROOM_MESSAGES, GET_TOP_POSTS, GET_USER_ACTIVITY } from "@/graphql/queries";
import useGuestGuard from "@/hooks/useGuestGuard";
import { cn } from "@/lib/utils";
import type { PostChatSendProps, MessagesData, CreateMessageData } from "@/types/postChat";

export default function PostChatSend({
  messageRoomId,
  title,
  postId,
  postUrl,
  postOwnerId,
}: PostChatSendProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const submitting = useAppStore((state) => state.chat.submitting);

  const user = useAppStore((state) => state.user.data);
  const setChatSubmitting = useAppStore((state) => state.setChatSubmitting);
  const storedQuote = useAppStore((state) => state.ui.pendingQuote);
  const setPendingQuote = useAppStore((state) => state.setPendingQuote);
  const ensureAuth = useGuestGuard();
  const loggedIn = !!(user?._id || user?.id);
  const userId = ((user?._id || user?.id) as string | undefined) ?? "";
  // Only show a quote staged from this post.
  const pendingQuote = storedQuote && storedQuote.postId === postId ? storedQuote : null;

  useEffect(() => {
    if (!pendingQuote) return;
    // Give the mobile Discussion sheet time to open before moving focus.
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, [pendingQuote]);

  const postRefetchQueries = postId
    ? [
        { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: "" } },
        { query: GET_POST, variables: { postId } },
      ]
    : [];

  const [addComment] = useMutation(ADD_COMMENT, { refetchQueries: postRefetchQueries });

  const [addQuote] = useMutation(ADD_QUOTE, {
    refetchQueries: [
      ...postRefetchQueries,
      {
        query: GET_USER_ACTIVITY,
        variables: {
          limit: 15,
          offset: 0,
          searchKey: "",
          activityEvent: ["POSTED", "VOTED", "COMMENTED", "QUOTED", "LIKED"],
          user_id: userId,
          startDateRange: "",
          endDateRange: "",
        },
      },
    ],
  });

  // A staged quote is posted as a Quote, or as a Comment carrying the quote when a note is added
  // (the API requires comment content, so an empty note can't be a comment).
  const submitQuote = async () => {
    if (!pendingQuote || !postId) return;
    const note = text.trim();
    setChatSubmitting(true);
    try {
      if (note) {
        await addComment({
          variables: {
            comment: {
              userId,
              content: note,
              startWordIndex: pendingQuote.startIndex,
              endWordIndex: pendingQuote.endIndex,
              postId,
              url: postUrl,
              quote: pendingQuote.text,
            },
          },
        });
      } else {
        if (!postOwnerId) throw new Error("Missing post author");
        await addQuote({
          variables: {
            quote: {
              quote: pendingQuote.text,
              postId,
              quoter: userId,
              quoted: postOwnerId,
              startWordIndex: pendingQuote.startIndex,
              endWordIndex: pendingQuote.endIndex,
            },
          },
        });
      }
      setPendingQuote(null);
      setText("");
      toast.success(note ? "Quote and note added" : "Quoted successfully");
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setChatSubmitting(false);
    }
  };

  const type = "POST";

  const [createMessage] = useMutation<CreateMessageData>(SEND_MESSAGE, {
    onError: (err) => {
      setChatSubmitting(false);
      toast.error(`Message failed: ${err.message}`);
    },
    onCompleted: () => {
      setChatSubmitting(false);
    },
    refetchQueries: messageRoomId
      ? [
          {
            query: GET_ROOM_MESSAGES,
            variables: { messageRoomId },
          },
        ]
      : [],
  });

  const handleSubmit = async () => {
    if (!ensureAuth()) return;
    if (pendingQuote) {
      await submitQuote();
      return;
    }
    if (!text.trim()) return;

    setChatSubmitting(true);

    const message = {
      title,
      type,
      messageRoomId: messageRoomId || null,
      componentId: postId || null,
      text: text.trim(),
    };

    const dateSubmitted = new Date();
    const tempId = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    await createMessage({
      variables: { message },
      optimisticResponse: {
        createMessage: {
          __typename: "Message" as const,
          _id: tempId,
          messageRoomId: messageRoomId || "",
          userName: (user.name as string) || "",
          userId: ((user._id || user.id) as string) || "",
          title: title || "",
          text: text.trim(),
          type,
          created: dateSubmitted.toISOString(),
          user: {
            __typename: "User" as const,
            _id: ((user._id || user.id) as string) || "",
            name: (user.name as string) || "",
            username: (user.username as string) || "",
            avatar: user.avatar as string | Record<string, unknown> | undefined,
          },
        },
      },
      update: (cache, { data: mutationData }) => {
        if (!messageRoomId || !mutationData?.createMessage) return;

        const existingData = cache.readQuery<MessagesData>({
          query: GET_ROOM_MESSAGES,
          variables: { messageRoomId },
        });

        if (existingData) {
          cache.writeQuery({
            query: GET_ROOM_MESSAGES,
            variables: { messageRoomId },
            data: {
              ...existingData,
              messages: [...existingData.messages, mutationData.createMessage],
            },
          });
        }
      },
    });

    setText("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  if (!loggedIn) {
    return (
      <div data-post-chat-send="true" className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            ensureAuth();
          }}
          data-testid="discussion-signin-cta"
          className={cn(
            "min-h-[40px] flex-1 rounded-xl border border-border bg-muted/50",
            "px-3 py-2.5 text-sm text-left text-foreground",
            "hover:bg-muted hover:border-[#52b274]/40 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          )}
          aria-label="Sign in to join the discussion"
        >
          Sign in to join the discussion
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            ensureAuth();
          }}
          className="h-10 w-10 shrink-0 rounded-full text-[#52b274] hover:bg-[#52b274]/10"
          aria-label="Sign in to join the discussion"
        >
          <Send className="h-4.5 w-4.5" />
        </Button>
      </div>
    );
  }

  const canSubmit = Boolean(text.trim() || pendingQuote) && !submitting;

  return (
    <div data-post-chat-send="true">
      {pendingQuote && (
        <div
          data-testid="composer-quote"
          className="mb-2 flex items-start gap-2 rounded-xl border-l-4 border-quoted bg-muted/60 py-2 pl-3 pr-1"
        >
          <blockquote className="line-clamp-3 flex-1 break-words text-sm italic text-foreground/80">
            {pendingQuote.text}
          </blockquote>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPendingQuote(null)}
            disabled={submitting}
            className="size-8 shrink-0 rounded-full text-muted-foreground"
            aria-label="Remove quoted passage"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          placeholder={pendingQuote ? "Add an optional note..." : "Add to discussion..."}
          aria-label={pendingQuote ? "Optional note for your quote" : undefined}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
          className={cn(
            "min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl",
            "border border-border bg-muted/50",
            "px-3 py-2.5 text-base md:text-sm",
            "placeholder:text-muted-foreground/50",
            "focus:bg-background focus:ring-2 focus:ring-primary/20",
            submitting && "opacity-50 cursor-not-allowed"
          )}
          rows={1}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "h-10 w-10 shrink-0 rounded-full",
            canSubmit
              ? "bg-[#52b274] text-white hover:bg-[#52b274]/90"
              : "text-[#52b274] hover:bg-[#52b274]/10",
            "disabled:opacity-30"
          )}
          aria-label="Send message"
        >
          {submitting ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
