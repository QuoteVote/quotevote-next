"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { X, Loader2, AlertTriangle, Hash, Link2, Quote, UserRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardFooter, CardAction } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { useAppStore } from "@/store";
import { useDebounce } from "@/hooks/useDebounce";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useResponsive } from "@/hooks/useResponsive";
import {
  submitPostSchema,
  isSubmitPostFormReady,
  type SubmitPostFormValues,
} from "@/lib/validation/submitPostSchema";
import { sanitizeUrl } from "@/lib/utils/sanitizeUrl";
import { getCreatedPostPath } from "@/lib/utils/createdPostPath";
import {
  clearSubmitPostDraft,
  draftToFormValues,
  formValuesToDraft,
  readSubmitPostDraft,
  resolveDraftTag,
  writeSubmitPostDraft,
} from "@/lib/utils/submitPostDraft";
import { ATTRIBUTION_MAX_LENGTH } from "@/lib/constants/attribution";
import { SUBMIT_POST_TITLE_MAX_LENGTH } from "@/lib/constants/submitPost";
import { CREATE_TAG, SUBMIT_POST } from "@/graphql/mutations";
import { TAGS_QUERY } from "@/graphql/queries";
import type { SubmitPostFormProps } from "@/types/components";
import { cn } from "@/lib/utils";

function CharacterCount({ current, max }: { current: number; max: number }) {
  if (current === 0) return null;

  const ratio = current / max;

  return (
    <p
      className={cn(
        "text-xs tabular-nums text-muted-foreground",
        ratio >= 1 && "text-destructive",
        ratio >= 0.8 && ratio < 1 && "text-amber-600"
      )}
      aria-live="polite"
    >
      {current}/{max}
    </p>
  );
}

/** One look for every composer field: white surface, soft border, brand focus ring. */
const FIELD_CLASS =
  "rounded-lg border border-input bg-card text-base text-foreground shadow-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 md:text-base";
const FIELD_ERROR_CLASS =
  "border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15";
const LABEL_CLASS = "text-sm font-medium text-foreground";

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-0.5 text-destructive">
        *
      </span>
      <span className="sr-only">(required)</span>
    </>
  );
}

export function SubmitPostForm({ options = [], user, setOpen }: SubmitPostFormProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const setSelectedPost = useAppStore((state) => state.setSelectedPost);
  const apolloClient = useApolloClient();
  const [submitPost, { loading }] = useMutation(SUBMIT_POST);
  const [createTag, { loading: loadingTag }] = useMutation(CREATE_TAG);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const citationErrorRef = useRef<HTMLParagraphElement>(null);
  const hasRestoredDraftRef = useRef(false);
  const tagReconciledRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubmitPostFormValues>({
    resolver: zodResolver(submitPostSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      text: "",
      citationUrl: "",
      attribution: "",
    },
  });

  const title = watch("title") ?? "";
  const text = watch("text") ?? "";
  const { ref: bodyAutoResizeRef } = useAutoResizeTextarea(text);
  const { ref: bodyRegisterRef, ...bodyField } = register("text");
  const attribution = watch("attribution") ?? "";
  const formValues = watch();
  const debouncedFormValues = useDebounce(formValues, 300);
  const canSubmit = isSubmitPostFormReady(formValues);
  const isMissingRequired = !title.trim() || !text.trim() || !formValues.tag;

  useEffect(() => {
    if (hasRestoredDraftRef.current) return;

    const draft = readSubmitPostDraft(user._id);
    if (!draft) {
      hasRestoredDraftRef.current = true;
      return;
    }

    reset(draftToFormValues(draft, options));
    hasRestoredDraftRef.current = true;
  }, [user._id, options, reset]);

  useEffect(() => {
    if (!hasRestoredDraftRef.current || tagReconciledRef.current || options.length === 0) return;

    const draft = readSubmitPostDraft(user._id);
    if (!draft?.tag) {
      tagReconciledRef.current = true;
      return;
    }

    const resolvedTag = resolveDraftTag(draft.tag, options);
    if (resolvedTag) {
      setValue("tag", resolvedTag, { shouldDirty: false });
    }

    tagReconciledRef.current = true;
  }, [options, user._id, setValue]);

  useEffect(() => {
    if (!hasRestoredDraftRef.current) return;
    writeSubmitPostDraft(user._id, formValuesToDraft(debouncedFormValues));
  }, [debouncedFormValues, user._id]);

  useEffect(() => {
    if (errors.text?.message?.includes("Links are not allowed") && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors.text]);

  useEffect(() => {
    if (errors.citationUrl?.message && citationErrorRef.current) {
      citationErrorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [errors.citationUrl]);

  const onSubmit = async (values: SubmitPostFormValues) => {
    const { title, text, tag, citationUrl, attribution: attr } = values;

    const sanitizedCitationUrl = citationUrl ? sanitizeUrl(citationUrl) : null;

    if (citationUrl?.trim() && !sanitizedCitationUrl) {
      setError("citationUrl", {
        type: "manual",
        message: "Invalid URL format. Please enter a valid http or https URL.",
      });
      return;
    }

    const tagData = typeof tag === "string" ? { title: tag } : tag;

    try {
      let newTag: { _id: string } | undefined;
      const isNewTag = tagData && !("_id" in tagData);

      if (isNewTag) {
        const tagTitle = typeof tagData === "object" && "title" in tagData ? tagData.title : "";

        setIsCreatingTag(true);
        setNewTagName(tagTitle);

        const createTagResult = await createTag({
          variables: {
            tag: {
              creatorId: user._id,
              title: tagTitle,
              description: `Description for: ${tagTitle} tag`,
              privacy: "public",
            },
          },
          refetchQueries: [{ query: TAGS_QUERY }],
        });

        newTag = (createTagResult.data as { createTag?: { _id: string } })?.createTag;
        setIsCreatingTag(false);
        setNewTagName("");

        if (!newTag?._id) {
          setError("tag", {
            type: "manual",
            message: "Tag was not created. Please try again.",
          });
          return;
        }
      }

      const postTagId = isNewTag
        ? newTag!._id
        : tagData && typeof tagData === "object" && "_id" in tagData
          ? (tagData as { _id: string })._id
          : undefined;

      if (!postTagId) {
        setError("tag", {
          type: "manual",
          message: "Please select or create a tag before posting.",
        });
        return;
      }

      const resolvedAttribution = attr?.trim() ? attr.trim() : null;

      const submitResult = await submitPost({
        variables: {
          post: {
            userId: user._id,
            text,
            title,
            tagId: postTagId,
            citationUrl: sanitizedCitationUrl,
            attribution: resolvedAttribution,
          },
        },
      });

      const addPostResult = (submitResult.data as { addPost?: { _id: string; url: string } })
        ?.addPost;
      const { _id, url } = addPostResult || {};
      if (_id) {
        clearSubmitPostDraft(user._id);
        reset();
        setSelectedPost(_id);
        apolloClient.cache.evict({ fieldName: "posts" });
        apolloClient.cache.gc();
        setOpen(false);
        const createdPostPath = getCreatedPostPath(url);
        toast.success("Post created!", {
          description: "Your quote has been published.",
          ...(createdPostPath && {
            action: {
              label: "View post",
              onClick: () => router.push(createdPostPath),
            },
          }),
        });
        router.push("/");
      }
    } catch (err) {
      setIsCreatingTag(false);
      setNewTagName("");
      const message =
        err instanceof Error ? err.message : "An error occurred while creating your post";
      toast.error("Could not create post", { description: message });
    }
  };

  const padX = isMobile ? "px-4" : "px-6";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
      <Card
        data-testid="post-composer"
        className={cn(
          "flex h-full min-h-0 w-full flex-col gap-0 rounded-none border-0 bg-card py-0 shadow-none",
          !isMobile && "sm:rounded-xl sm:border sm:shadow-lg"
        )}
      >
        <CardHeader
          className={cn(
            "flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border/70 py-4",
            padX
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <Quote className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold leading-tight text-foreground">
                Create Quote
              </CardTitle>
              <p className="truncate text-sm text-muted-foreground">
                Share a quote and start the discussion.
              </p>
            </div>
          </div>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardAction>
        </CardHeader>

        {/* Title and tag stay in view while the body scrolls */}
        <div className={cn("shrink-0 space-y-4 border-b border-border/70 py-4", padX)}>
          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor="title" className={LABEL_CLASS}>
                Title
                <RequiredMark />
              </Label>
              <CharacterCount current={title.length} max={SUBMIT_POST_TITLE_MAX_LENGTH} />
            </div>
            <Input
              id="title"
              data-testid="post-title-input"
              placeholder="Give your quote a clear title"
              aria-required="true"
              aria-invalid={!!errors.title || undefined}
              maxLength={SUBMIT_POST_TITLE_MAX_LENGTH}
              {...register("title")}
              className={cn(
                FIELD_CLASS,
                "h-11 px-3.5 font-medium",
                errors.title && FIELD_ERROR_CLASS
              )}
            />
            {errors.title && (
              <p className="text-sm text-destructive" data-testid="post-title-error">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label id="post-tag-label" className={LABEL_CLASS}>
                Tag
                <RequiredMark />
              </Label>
            </div>
            {isCreatingTag && (
              <p className="flex items-center gap-1.5 text-sm text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Creating tag &quot;{newTagName}&quot;...
              </p>
            )}
            <Controller
              name="tag"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={
                    options as Array<{ _id?: string; title: string; [key: string]: unknown }>
                  }
                  value={field.value || null}
                  onValueChange={field.onChange}
                  placeholder="Select or create a tag"
                  error={!!errors.tag}
                  errorMessage={errors.tag?.message}
                  errorTestId="post-tag-error"
                  disabled={loadingTag || loading}
                  allowCreate={true}
                  side={isMobile ? "top" : "bottom"}
                  triggerTestId="post-tag-select"
                  createOptionTestId="post-tag-create"
                  startIcon={<Hash className="h-4 w-4" />}
                  ariaLabelledBy="post-tag-label"
                  triggerClassName={cn(
                    FIELD_CLASS,
                    "h-11 px-3.5 font-normal hover:bg-card",
                    errors.tag && FIELD_ERROR_CLASS
                  )}
                />
              )}
            />
          </div>
        </div>

        {/* Post body and optional details scroll together; the body grows with its content */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-4",
            padX
          )}
        >
          <div className="mb-1.5 flex h-5 items-center justify-between gap-2">
            <Label htmlFor="text" className={LABEL_CLASS}>
              Post content
              <RequiredMark />
            </Label>
            <span className="text-xs text-muted-foreground">No links. Add a source below.</span>
          </div>
          <Textarea
            id="text"
            data-testid="post-body-input"
            placeholder="What did they say? Paste or type the quote here."
            aria-required="true"
            aria-invalid={!!errors.text || undefined}
            rows={8}
            {...bodyField}
            ref={(el) => {
              bodyRegisterRef(el);
              bodyAutoResizeRef.current = el;
            }}
            className={cn(
              FIELD_CLASS,
              "min-h-48 w-full shrink-0 resize-none overflow-hidden px-4 py-3 leading-relaxed sm:min-h-64",
              errors.text && FIELD_ERROR_CLASS
            )}
          />
          {errors.text && (
            <div
              ref={errorAlertRef}
              role="alert"
              className="mt-2 flex shrink-0 items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm font-medium text-destructive" data-testid="post-body-error">
                {errors.text.message}
              </p>
            </div>
          )}

          {/* Optional details scroll with the body, so they don't take writing space */}
          <section aria-labelledby="post-details-heading" className="mt-6 shrink-0">
            <div className="mb-3 flex items-center gap-2">
              <p id="post-details-heading" className="text-sm font-semibold text-foreground">
                Add details
              </p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Optional
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <Label htmlFor="citationUrl" className={LABEL_CLASS}>
                    Citation link
                  </Label>
                </div>
                <div className="relative">
                  <Link2
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="citationUrl"
                    data-testid="post-citation-input"
                    placeholder="https://example.com/article"
                    aria-invalid={!!errors.citationUrl || undefined}
                    {...register("citationUrl")}
                    className={cn(
                      FIELD_CLASS,
                      "h-10 pl-9 pr-3 text-sm md:text-sm",
                      errors.citationUrl && FIELD_ERROR_CLASS
                    )}
                  />
                </div>
                {errors.citationUrl && (
                  <p
                    ref={citationErrorRef}
                    className="text-sm text-destructive"
                    data-testid="post-citation-error"
                  >
                    {errors.citationUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <Label htmlFor="attribution" className={LABEL_CLASS}>
                    Who said this?
                  </Label>
                  <CharacterCount current={attribution.length} max={ATTRIBUTION_MAX_LENGTH} />
                </div>
                <div className="relative">
                  <UserRound
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="attribution"
                    data-testid="post-attribution-input"
                    placeholder="Name of the speaker"
                    maxLength={ATTRIBUTION_MAX_LENGTH}
                    {...register("attribution")}
                    className={cn(FIELD_CLASS, "h-10 pl-9 pr-3 text-sm md:text-sm")}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <CardFooter
          className={cn(
            "flex shrink-0 flex-col gap-2 border-t border-border/70 pt-3",
            padX,
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            !isMobile && "sm:pb-4 sm:pt-4"
          )}
        >
          <Button
            id="submit-button"
            data-testid="post-submit-button"
            type="submit"
            variant="default"
            className="h-11 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-primary/40 disabled:opacity-100"
            disabled={loadingTag || loading || !canSubmit}
          >
            {loading || loadingTag ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
          {isMissingRequired && !loading && !loadingTag && (
            <p className="text-center text-xs text-muted-foreground">
              Add a title, a tag and the quote to post.
            </p>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
