"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { X, Loader2, AlertTriangle, Check, Link2, UserRound } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useAppStore } from "@/store";
import { useDebounce } from "@/hooks/useDebounce";
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
  isSubmitPostDraftEmpty,
  writeSubmitPostDraft,
} from "@/lib/utils/submitPostDraft";
import { ATTRIBUTION_MAX_LENGTH } from "@/lib/constants/attribution";
import {
  SUBMIT_POST_COUNTER_WARN_RATIO,
  SUBMIT_POST_TEXT_MAX_LENGTH,
  SUBMIT_POST_TITLE_MAX_LENGTH,
} from "@/lib/constants/submitPost";
import { CREATE_TAG, SUBMIT_POST } from "@/graphql/mutations";
import { TAGS_QUERY } from "@/graphql/queries";
import { CITATION_URL_ERROR } from "@/lib/validation/submitPostSchema";
import type { SubmitPostFormProps } from "@/types/components";
import { SubmitPostPreview } from "./SubmitPostPreview";

const formatCount = (n: number) => n.toLocaleString("en-US");

/** "58 / 120": amber from 80% of the limit, red at it (the design's counters). */
function Counter({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  return (
    <span
      className="qv-compose-count"
      data-warn={(ratio >= SUBMIT_POST_COUNTER_WARN_RATIO && ratio < 1) || undefined}
      data-over={ratio >= 1 || undefined}
      aria-live="polite"
    >
      {formatCount(current)}
      <span className="qv-compose-slash">/</span>
      {formatCount(max)}
    </span>
  );
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="qv-compose-required">
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
  const tagReconciledRef = useRef(false);
  // A saved draft is the form's starting value, so there is never an empty state that
  // the draft writer could save over it (closing quickly used to lose the draft).
  const [initialValues] = useState<SubmitPostFormValues>(() => {
    const draft = readSubmitPostDraft(user._id);
    return draft
      ? draftToFormValues(draft, options)
      : { title: "", text: "", citationUrl: "", attribution: "" };
  });

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
    defaultValues: initialValues,
  });

  const title = watch("title") ?? "";
  const text = watch("text") ?? "";
  const attribution = watch("attribution") ?? "";
  const formValues = watch();
  const debouncedFormValues = useDebounce(formValues, 300);
  const currentDraftKey = JSON.stringify(formValuesToDraft(formValues));
  const canSubmit = isSubmitPostFormReady(formValues);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (tagReconciledRef.current || options.length === 0) return;

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
    const draft = formValuesToDraft(debouncedFormValues);
    // Save only once the debounce has caught up with the form.
    if (JSON.stringify(draft) !== currentDraftKey) return;
    writeSubmitPostDraft(user._id, draft);
    setDraftSaved(!isSubmitPostDraftEmpty(draft));
  }, [debouncedFormValues, currentDraftKey, user._id]);

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
        message: CITATION_URL_ERROR,
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
        setDraftSaved(false);
        reset({ title: "", text: "", citationUrl: "", attribution: "", tag: undefined });
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

  const titleId = "create-quote-title";
  const citation = formValues.citationUrl ?? "";
  const citationValid =
    citation.trim().length > 0 && !errors.citationUrl && sanitizeUrl(citation) !== null;
  const tagValue = formValues.tag;
  const tagTitle =
    typeof tagValue === "string" ? tagValue : tagValue && "title" in tagValue ? tagValue.title : "";
  const busy = loading || loadingTag;

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-labelledby={titleId} className="qv-compose-form">
      <div data-testid="post-composer" className="qv-compose-main">
        <header className="qv-compose-head">
          <h2 id={titleId} className="qv-compose-title">
            Create Quote
          </h2>
          <button
            type="button"
            className="qv-compose-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </header>

        <div className="qv-compose-body">
          <p className="qv-compose-sub">Share a quote and start the discussion.</p>

          <div className="qv-auth-field">
            <div className="qv-compose-label-row">
              <label htmlFor="title" className="qv-auth-label">
                Title
                <RequiredMark />
              </label>
              <Counter current={title.length} max={SUBMIT_POST_TITLE_MAX_LENGTH} />
            </div>
            <input
              id="title"
              data-testid="post-title-input"
              placeholder="Give your quote a clear title"
              aria-required="true"
              aria-invalid={!!errors.title || undefined}
              maxLength={SUBMIT_POST_TITLE_MAX_LENGTH}
              {...register("title")}
              className="qv-auth-input"
            />
            {errors.title && (
              <p className="qv-auth-err" data-testid="post-title-error">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="qv-auth-field">
            <span id="post-tag-label" className="qv-auth-label">
              Tag
              <RequiredMark />
            </span>
            {isCreatingTag && (
              <p className="qv-compose-status" role="status">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
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
                  disabled={busy}
                  allowCreate={true}
                  side={isMobile ? "top" : "bottom"}
                  triggerTestId="post-tag-select"
                  createOptionTestId="post-tag-create"
                  ariaLabelledBy="post-tag-label"
                  hideIndicator
                  renderValue={(label) => (
                    <>
                      <span className="qv-compose-chip qv-compose-chip-in"># {label}</span>
                      <span className="qv-compose-placeholder" aria-hidden="true">
                        Select or create a tag
                      </span>
                    </>
                  )}
                  triggerClassName="qv-auth-input qv-compose-tag"
                />
              )}
            />
          </div>

          <div className="qv-auth-field">
            <div className="qv-compose-label-row">
              <label htmlFor="text" className="qv-auth-label">
                Post content
                <RequiredMark />
              </label>
              <Counter current={text.length} max={SUBMIT_POST_TEXT_MAX_LENGTH} />
            </div>
            <textarea
              id="text"
              data-testid="post-body-input"
              placeholder="What did they say? Paste or type the quote here."
              aria-required="true"
              aria-invalid={!!errors.text || undefined}
              aria-describedby="post-body-hint"
              rows={6}
              maxLength={SUBMIT_POST_TEXT_MAX_LENGTH}
              {...register("text")}
              className="qv-auth-input qv-compose-text"
            />
            <span id="post-body-hint" className="qv-auth-hint qv-compose-hint">
              No links. Add a source below.
            </span>
            {errors.text && (
              <div ref={errorAlertRef} role="alert" className="qv-compose-alert">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p data-testid="post-body-error">{errors.text.message}</p>
              </div>
            )}
          </div>

          <details open className="qv-compose-details">
            <summary>
              Add details <span className="qv-compose-optional">· Optional</span>
            </summary>
            <div className="qv-compose-details-grid">
              <div className="qv-auth-field">
                <label htmlFor="citationUrl" className="qv-auth-label">
                  Citation link
                </label>
                <div className="qv-compose-field" data-invalid={!!errors.citationUrl || undefined}>
                  <Link2 className="qv-compose-field-icon" aria-hidden="true" />
                  <input
                    id="citationUrl"
                    data-testid="post-citation-input"
                    placeholder="https://example.com/article"
                    inputMode="url"
                    aria-invalid={!!errors.citationUrl || undefined}
                    aria-describedby={
                      errors.citationUrl ? "post-citation-error" : "post-citation-hint"
                    }
                    {...register("citationUrl")}
                  />
                  {citationValid && (
                    <Check
                      className="qv-compose-check"
                      strokeWidth={2.4}
                      aria-label="Valid link"
                      role="img"
                    />
                  )}
                </div>
                {errors.citationUrl ? (
                  <p
                    id="post-citation-error"
                    ref={citationErrorRef}
                    className="qv-auth-err"
                    data-testid="post-citation-error"
                  >
                    {errors.citationUrl.message}
                  </p>
                ) : (
                  <span id="post-citation-hint" className="qv-auth-hint">
                    Where the quote comes from. Shown under the quote.
                  </span>
                )}
              </div>

              <div className="qv-auth-field">
                <div className="qv-compose-label-row">
                  <label htmlFor="attribution" className="qv-auth-label">
                    Who said this?
                  </label>
                  {attribution.length >=
                    ATTRIBUTION_MAX_LENGTH * SUBMIT_POST_COUNTER_WARN_RATIO && (
                    <Counter current={attribution.length} max={ATTRIBUTION_MAX_LENGTH} />
                  )}
                </div>
                <div className="qv-compose-field">
                  <UserRound className="qv-compose-field-icon" aria-hidden="true" />
                  <input
                    id="attribution"
                    data-testid="post-attribution-input"
                    placeholder="Name of the speaker"
                    maxLength={ATTRIBUTION_MAX_LENGTH}
                    aria-describedby="post-attribution-hint"
                    {...register("attribution")}
                  />
                </div>
                <span id="post-attribution-hint" className="qv-auth-hint">
                  A person, office or publication.
                </span>
              </div>
            </div>
          </details>
        </div>

        <footer className="qv-compose-foot">
          <span className="qv-auth-hint qv-compose-saved" role="status" aria-live="polite">
            {draftSaved && (
              <>
                <Check
                  className="qv-compose-check size-[15px]"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
                Draft saved
              </>
            )}
          </span>
          <div className="qv-compose-actions">
            <button
              type="button"
              className="qv-auth-btn qv-compose-cancel"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              id="submit-button"
              data-testid="post-submit-button"
              type="submit"
              className="qv-auth-btn qv-auth-btn-primary qv-compose-post"
              disabled={busy || !canSubmit}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </footer>
      </div>

      <SubmitPostPreview
        title={title}
        text={text}
        tagTitle={tagTitle}
        citationUrl={citation}
        attribution={attribution}
        username={String(user.username ?? user.name ?? "you")}
        avatar={user.avatar as string | Record<string, unknown> | null | undefined}
      />
    </form>
  );
}
