'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useApolloClient } from '@apollo/client/react'
import { X, Loader2, Info, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppStore } from '@/store'
import { useDebounce } from '@/hooks/useDebounce'
import { useResponsive } from '@/hooks/useResponsive'
import { submitPostSchema, isSubmitPostFormReady, type SubmitPostFormValues } from '@/lib/validation/submitPostSchema'
import { sanitizeUrl } from '@/lib/utils/sanitizeUrl'
import {
  clearSubmitPostDraft,
  draftToFormValues,
  formValuesToDraft,
  readSubmitPostDraft,
  resolveDraftTag,
  writeSubmitPostDraft,
} from '@/lib/utils/submitPostDraft'
import { ATTRIBUTION_MAX_LENGTH } from '@/lib/constants/attribution'
import { SUBMIT_POST_TITLE_MAX_LENGTH } from '@/lib/constants/submitPost'
import { CREATE_GROUP, SUBMIT_POST } from '@/graphql/mutations'
import { GROUPS_QUERY } from '@/graphql/queries'
import type { SubmitPostFormProps } from '@/types/components'
import { cn } from '@/lib/utils'

function CharacterCount({ current, max }: { current: number; max: number }) {
  if (current === 0) return null

  const ratio = current / max

  return (
    <p
      className={cn(
        'mt-1 text-right text-xs text-muted-foreground',
        ratio >= 1 && 'text-destructive',
        ratio >= 0.8 && ratio < 1 && 'text-amber-600'
      )}
      aria-live="polite"
    >
      {current}/{max}
    </p>
  )
}

export function SubmitPostForm({ options = [], user, setOpen }: SubmitPostFormProps) {
  const router = useRouter()
  const { isMobile } = useResponsive()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const apolloClient = useApolloClient()
  const [submitPost, { loading }] = useMutation(SUBMIT_POST)
  const [createTag, { loading: loadingTag }] = useMutation(CREATE_GROUP)
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const errorAlertRef = useRef<HTMLDivElement>(null)
  const citationErrorRef = useRef<HTMLParagraphElement>(null)
  const hasRestoredDraftRef = useRef(false)
  const tagReconciledRef = useRef(false)

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
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      text: '',
      citationUrl: '',
      attribution: '',
    },
  })

  const title = watch('title') ?? ''
  const attribution = watch('attribution') ?? ''
  const formValues = watch()
  const debouncedFormValues = useDebounce(formValues, 300)
  const canSubmit = isSubmitPostFormReady(formValues)

  useEffect(() => {
    if (hasRestoredDraftRef.current) return

    const draft = readSubmitPostDraft(user._id)
    if (!draft) {
      hasRestoredDraftRef.current = true
      return
    }

    reset(draftToFormValues(draft, options))
    hasRestoredDraftRef.current = true
  }, [user._id, options, reset])

  useEffect(() => {
    if (!hasRestoredDraftRef.current || tagReconciledRef.current || options.length === 0) return

    const draft = readSubmitPostDraft(user._id)
    if (!draft?.tag) {
      tagReconciledRef.current = true
      return
    }

    const resolvedTag = resolveDraftTag(draft.tag, options)
    if (resolvedTag) {
      setValue('tag', resolvedTag, { shouldDirty: false })
    }

    tagReconciledRef.current = true
  }, [options, user._id, setValue])

  useEffect(() => {
    if (!hasRestoredDraftRef.current) return
    writeSubmitPostDraft(user._id, formValuesToDraft(debouncedFormValues))
  }, [debouncedFormValues, user._id])

  useEffect(() => {
    if (errors.text?.message?.includes('Links are not allowed') && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [errors.text])

  useEffect(() => {
    if (errors.citationUrl?.message && citationErrorRef.current) {
      citationErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [errors.citationUrl])

  const onSubmit = async (values: SubmitPostFormValues) => {
    const { title, text, tag, citationUrl, attribution: attr } = values

    const sanitizedCitationUrl = citationUrl ? sanitizeUrl(citationUrl) : null

    const tagData = typeof tag === 'string' ? { title: tag } : tag

    try {
      let newTag: { _id: string } | undefined
      const isNewTag = tagData && !('_id' in tagData)

      if (isNewTag) {
        const tagTitle =
          typeof tagData === 'object' && 'title' in tagData ? tagData.title : ''

        setIsCreatingTag(true)
        setNewTagName(tagTitle)

        const createTagResult = await createTag({
          variables: {
            group: {
              creatorId: user._id,
              title: tagTitle,
              description: `Description for: ${tagTitle} tag`,
              privacy: 'public',
            },
          },
          refetchQueries: [{ query: GROUPS_QUERY, variables: { limit: 0 } }],
        })

        newTag = (createTagResult.data as { createGroup?: { _id: string } })?.createGroup
        setIsCreatingTag(false)
        setNewTagName('')

        if (!newTag?._id) {
          setError('tag', {
            type: 'manual',
            message: 'Tag was not created. Please try again.',
          })
          return
        }
      }

      const postTagId = isNewTag
        ? newTag!._id
        : tagData && typeof tagData === 'object' && '_id' in tagData
          ? (tagData as { _id: string })._id
          : undefined

      if (!postTagId) {
        setError('tag', {
          type: 'manual',
          message: 'Please select or create a tag before posting.',
        })
        return
      }

      const resolvedAttribution = attr?.trim() ? attr.trim() : null

      const submitResult = await submitPost({
        variables: {
          post: {
            userId: user._id,
            text,
            title,
            groupId: postTagId,
            citationUrl: sanitizedCitationUrl,
            attribution: resolvedAttribution,
          },
        },
      })

      const addPostResult = (submitResult.data as { addPost?: { _id: string; url: string } })?.addPost
      const { _id } = addPostResult || {}
      if (_id) {
        clearSubmitPostDraft(user._id)
        reset()
        setSelectedPost(_id)
        apolloClient.cache.evict({ fieldName: 'posts' })
        apolloClient.cache.gc()
        setOpen(false)
        toast.success('Post created!', { description: 'Your quote has been published.' })
        router.push('/dashboard/explore')
      }
    } catch (err) {
      setIsCreatingTag(false)
      setNewTagName('')
      const message =
        err instanceof Error ? err.message : 'An error occurred while creating your post'
      toast.error('Could not create post', { description: message })
    }
  }

  const padX = isMobile ? 'px-4' : 'px-5'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
        <Card
          data-testid="post-composer"
          className={cn(
            'flex h-full min-h-0 w-full flex-col gap-0 rounded-none border-0 py-0 shadow-none',
            !isMobile && 'sm:rounded-lg sm:border sm:shadow-sm'
          )}
        >
          <CardHeader
            className={cn(
              'flex shrink-0 flex-row items-center justify-between border-b py-3',
              padX,
              !isMobile && 'sm:py-4'
            )}
          >
            <CardTitle className="text-2xl text-[#52b274]">Create Quote</CardTitle>
            <CardAction>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-[#52b274]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardAction>
          </CardHeader>

          {/* Fixed title */}
          <div className={cn('shrink-0 border-b py-3', padX)}>
            <Input
              id="title"
              data-testid="post-title-input"
              placeholder="Enter Title"
              maxLength={SUBMIT_POST_TITLE_MAX_LENGTH}
              {...register('title')}
              className={cn(
                'rounded-none border-0 px-0 text-lg shadow-none focus-visible:ring-0',
                errors.title && 'border-b border-destructive'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive" data-testid="post-title-error">
                {errors.title.message}
              </p>
            )}
            <CharacterCount current={title.length} max={SUBMIT_POST_TITLE_MAX_LENGTH} />

            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {isCreatingTag && (
                  <span className="text-sm italic text-[#52b274]">
                    Creating tag &quot;{newTagName}&quot;...
                  </span>
                )}
              </div>

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
                    label=""
                    error={!!errors.tag}
                    errorMessage={errors.tag?.message}
                    errorTestId="post-tag-error"
                    disabled={loadingTag || loading}
                    allowCreate={true}
                    side={isMobile ? 'top' : 'bottom'}
                    triggerTestId="post-tag-select"
                    createOptionTestId="post-tag-create"
                    className="bg-[rgba(160,243,204,0.6)]"
                  />
                )}
              />
            </div>
          </div>

          {/* Only the post body scrolls */}
          <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-3', padX)}>
            <Textarea
              id="text"
              data-testid="post-body-input"
              placeholder="Enter your post content (no links allowed)"
              rows={8}
              {...register('text')}
              style={{ fieldSizing: 'fixed', minHeight: '100%' }}
              className={cn(
                'min-h-full w-full flex-1 resize-none rounded-none border-0 px-0 shadow-none focus-visible:ring-0',
                errors.text && 'border border-destructive'
              )}
            />
            {errors.text && (
              <div
                ref={errorAlertRef}
                className="mt-2 flex shrink-0 items-center gap-2 rounded border border-red-400 bg-red-50 p-3"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-600" data-testid="post-body-error">
                  {errors.text.message}
                </p>
              </div>
            )}
          </div>

          {/* Optional details */}
          <div className={cn('shrink-0 space-y-3 border-t py-3', padX)}>
            <p className="text-sm font-medium text-black">Add details (optional)</p>

            <div className="space-y-4 rounded-md border border-border/60 bg-muted/30 p-3">
              <div>
                <Label htmlFor="citationUrl" className="mb-1.5 block text-sm font-medium">
                  Citation link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="citationUrl"
                    data-testid="post-citation-input"
                    placeholder="https://example.com/article (optional)"
                    {...register('citationUrl')}
                    className={cn('flex-1 bg-background', errors.citationUrl && 'border-destructive')}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-[#52b274]"
                        aria-label="Citation help"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="z-[80] max-w-xs p-3">
                      <p className="text-sm">
                        One citation per post. No other links allowed in the body.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.citationUrl && (
                  <p
                    ref={citationErrorRef}
                    className="mt-1 text-sm text-destructive"
                    data-testid="post-citation-error"
                  >
                    {errors.citationUrl.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="attribution" className="mb-1.5 block text-sm font-medium">
                  Who said this?
                </Label>
                <Input
                  id="attribution"
                  data-testid="post-attribution-input"
                  placeholder="Enter name here"
                  maxLength={ATTRIBUTION_MAX_LENGTH}
                  className="bg-background"
                  {...register('attribution')}
                />
                <CharacterCount current={attribution.length} max={ATTRIBUTION_MAX_LENGTH} />
              </div>
            </div>
          </div>

          <CardFooter
            className={cn(
              'flex shrink-0 flex-col gap-3 border-t pt-3',
              padX,
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
              !isMobile && 'sm:pb-4 sm:pt-4'
            )}
          >
            <Button
              id="submit-button"
              data-testid="post-submit-button"
              type="submit"
              variant="default"
              className="w-full bg-[#52b274] text-lg text-white hover:bg-[#52b274]/90"
              disabled={loadingTag || loading || !canSubmit}
            >
              {loading || loadingTag ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Posting...
                </>
              ) : (
                'POST'
              )}
            </Button>
          </CardFooter>
        </Card>
    </form>
  )
}
