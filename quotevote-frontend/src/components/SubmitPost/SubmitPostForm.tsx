'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@apollo/client/react'
import { X, Loader2, Info, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useResponsive } from '@/hooks/useResponsive'
import { submitPostSchema, type SubmitPostFormValues } from '@/lib/validation/submitPostSchema'
import { sanitizeUrl } from '@/lib/utils/sanitizeUrl'
import { CREATE_GROUP, SUBMIT_POST } from '@/graphql/mutations'
import { SubmitPostAlert } from './SubmitPostAlert'
import type { SubmitPostFormProps } from '@/types/components'
import { cn } from '@/lib/utils'

export function SubmitPostForm({ options = [], user, setOpen }: SubmitPostFormProps) {
  const { isMobile } = useResponsive()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const [submitPost, { loading }] = useMutation(SUBMIT_POST)
  const [createGroup, { loading: loadingGroup }] = useMutation(CREATE_GROUP)
  const [error, setError] = useState<Error | { message?: string } | null>(null)
  const [shareableLink, setShareableLink] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const errorAlertRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubmitPostFormValues>({
    resolver: zodResolver(submitPostSchema),
    defaultValues: {
      title: '',
      text: '',
      citationUrl: '',
    },
  })

  useEffect(() => {
    if (errors.text?.message?.includes('Links are not allowed') && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [errors.text])

  const onSubmit = async (values: SubmitPostFormValues) => {
    const { title, text, group, citationUrl } = values

    const sanitizedCitationUrl = citationUrl ? sanitizeUrl(citationUrl) : null

    if (citationUrl && !sanitizedCitationUrl) {
      setError({ message: 'Invalid URL format.' })
      setShowAlert(true)
      return
    }

    const groupData = typeof group === 'string' ? { title: group } : group

    try {
      let newGroup
      const isNewGroup = groupData && !('_id' in groupData)

      if (isNewGroup) {
        setIsCreatingGroup(true)
        setNewGroupName(
          typeof groupData === 'object' && 'title' in groupData ? groupData.title : ''
        )

        const createGroupResult = await createGroup({
          variables: {
            group: {
              creatorId: user._id,
              title:
                typeof groupData === 'object' && 'title' in groupData ? groupData.title : '',
              description: `Description for: ${
                typeof groupData === 'object' && 'title' in groupData ? groupData.title : ''
              } group`,
              privacy: 'public',
            },
          },
        })

        newGroup = (createGroupResult.data as { createGroup?: { _id: string } })?.createGroup
        setIsCreatingGroup(false)
        setNewGroupName('')
      }

      const postGroupId = isNewGroup
        ? newGroup?._id
        : typeof groupData === 'object' && '_id' in groupData
          ? groupData._id
          : ''

      const submitResult = await submitPost({
        variables: {
          post: {
            userId: user._id,
            text,
            title,
            groupId: postGroupId,
            citationUrl: sanitizedCitationUrl,
          },
        },
      })

      const { _id, url } =
        (submitResult.data as { addPost?: { _id: string; url: string } })?.addPost || {}
      if (_id) {
        setSelectedPost(_id)
        setShareableLink(url || '')
        setShowAlert(true)
      }
    } catch (err) {
      setIsCreatingGroup(false)
      setNewGroupName('')
      setError(
        err instanceof Error ? err : { message: 'An error occurred while creating your post' }
      )
      setShowAlert(true)
    }
  }

  const hideAlert = () => {
    setShowAlert(false)
    setShareableLink('')
    reset()
  }

  return (
    <>
      {showAlert && (
        <SubmitPostAlert
          hideAlert={hideAlert}
          shareableLink={shareableLink}
          error={error}
          setShowAlert={setShowAlert}
          setOpen={setOpen}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          className={cn(
            'flex flex-col w-full',
            isMobile ? 'h-screen max-h-screen' : 'max-h-[calc(100vh-200px)]'
          )}
        >
          <CardHeader
            className={cn(
              'flex flex-row items-center justify-between',
              isMobile ? 'p-4' : 'p-5'
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
              >
                <X className="h-5 w-5" />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent
            className={cn(
              'flex-1 flex flex-col overflow-hidden',
              isMobile ? 'px-4' : 'px-5'
            )}
          >
            <div className="flex-1 flex flex-col min-h-0">
              {/* Title — no label, placeholder only (matches monorepo InputBase) */}
              <Input
                id="title"
                placeholder="Enter Title"
                {...register('title')}
                className={cn('text-lg border-0 shadow-none px-0 focus-visible:ring-0 rounded-none', errors.title && 'border-b border-destructive')}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}

              <div className="border-t my-2" />

              {/* Content — scrollable, no label, placeholder only (matches monorepo) */}
              <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                <Textarea
                  id="text"
                  placeholder="Enter your post content (no links allowed)"
                  {...register('text')}
                  className={cn(
                    'h-full resize-none border-0 shadow-none focus-visible:ring-0 px-0 rounded-none',
                    isMobile ? 'min-h-[50vh]' : 'min-h-[75vh]',
                    errors.text && 'border border-destructive'
                  )}
                />
                {errors.text && (
                  <div
                    ref={errorAlertRef}
                    className="flex items-center gap-2 bg-red-50 border border-red-400 rounded p-3 mt-2"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600 font-medium">{errors.text.message}</p>
                  </div>
                )}
              </div>

              <div className="border-t my-4" />

              {/* Citation URL — below content, with tooltip (matches monorepo layout) */}
              <div className="flex items-center gap-2">
                <Input
                  id="citationUrl"
                  placeholder="Source URL (e.g. https://wikipedia.org/wiki/...)"
                  {...register('citationUrl')}
                  className={cn('flex-1', errors.citationUrl && 'border-destructive')}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#52b274] shrink-0"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>One citation per post. No other links allowed in the body.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {errors.citationUrl && (
                <p className="text-sm text-destructive mt-1">{errors.citationUrl.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter
            className={cn(
              'flex flex-col gap-4 border-t pt-5',
              isMobile ? 'px-4 pb-4' : 'px-5 pb-5'
            )}
          >
            <div
              className={cn(
                'flex w-full gap-4',
                isMobile ? 'flex-col' : 'flex-row items-center justify-between'
              )}
            >
              <div className="flex items-center gap-2">
                <Label className="font-medium">Who can see your post</Label>
                {isCreatingGroup && (
                  <span className="text-sm text-[#52b274] italic">
                    Creating group &quot;{newGroupName}&quot;...
                  </span>
                )}
              </div>

              <div className={cn('w-full', isMobile ? '' : 'max-w-[220px]')}>
                <Controller
                  name="group"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={
                        options as Array<{ _id?: string; title: string; [key: string]: unknown }>
                      }
                      value={field.value || null}
                      onValueChange={field.onChange}
                      placeholder="Select a group"
                      label=""
                      error={!!errors.group}
                      errorMessage={errors.group?.message}
                      disabled={loadingGroup || loading}
                      allowCreate={true}
                      className="bg-[rgba(160,243,204,0.6)]"
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end w-full">
              <Button
                id="submit-button"
                type="submit"
                variant="default"
                className="w-full bg-[#52b274] hover:bg-[#52b274]/90 text-white text-lg"
                disabled={loadingGroup || loading}
              >
                {loading || loadingGroup ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'POST'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </>
  )
}
