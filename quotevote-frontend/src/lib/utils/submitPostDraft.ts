import type { SubmitPostFormValues } from '@/lib/validation/submitPostSchema'
import type { SubmitPostDraft, SubmitPostDraftTag } from '@/types/submitPostDraft'

const DRAFT_KEY_PREFIX = 'quotevote:submit-post-draft:'

export function getSubmitPostDraftKey(userId: string): string {
  return `${DRAFT_KEY_PREFIX}${userId}`
}

function isDraftTagEmpty(tag: SubmitPostDraft['tag']): boolean {
  if (tag == null) return true
  if (typeof tag === 'string') return tag.trim().length === 0
  return tag.title.trim().length === 0
}

export function isSubmitPostDraftEmpty(draft: SubmitPostDraft): boolean {
  return (
    !draft.title.trim() &&
    !draft.text.trim() &&
    !draft.citationUrl.trim() &&
    !draft.attribution.trim() &&
    isDraftTagEmpty(draft.tag)
  )
}

export function readSubmitPostDraft(userId: string): SubmitPostDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(getSubmitPostDraftKey(userId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<SubmitPostDraft>
    if (typeof parsed !== 'object' || parsed === null) return null

    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      text: typeof parsed.text === 'string' ? parsed.text : '',
      citationUrl: typeof parsed.citationUrl === 'string' ? parsed.citationUrl : '',
      attribution: typeof parsed.attribution === 'string' ? parsed.attribution : '',
      tag: normalizeDraftTag(parsed.tag),
    }
  } catch {
    return null
  }
}

function normalizeDraftTag(value: unknown): SubmitPostDraft['tag'] {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'title' in value) {
    const tag = value as SubmitPostDraftTag
    if (typeof tag.title !== 'string') return null
    return {
      _id: typeof tag._id === 'string' ? tag._id : undefined,
      title: tag.title,
    }
  }
  return null
}

export function writeSubmitPostDraft(userId: string, draft: SubmitPostDraft): void {
  if (typeof window === 'undefined') return

  if (isSubmitPostDraftEmpty(draft)) {
    clearSubmitPostDraft(userId)
    return
  }

  sessionStorage.setItem(getSubmitPostDraftKey(userId), JSON.stringify(draft))
}

export function clearSubmitPostDraft(userId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(getSubmitPostDraftKey(userId))
}

export function formValuesToDraft(values: SubmitPostFormValues): SubmitPostDraft {
  const { title, text, citationUrl, attribution, tag } = values

  let serializedTag: SubmitPostDraft['tag'] = null
  if (tag) {
    if (typeof tag === 'string') {
      serializedTag = tag
    } else {
      serializedTag = {
        _id: '_id' in tag && typeof tag._id === 'string' ? tag._id : undefined,
        title: tag.title,
      }
    }
  }

  return {
    title: title ?? '',
    text: text ?? '',
    citationUrl: citationUrl ?? '',
    attribution: attribution ?? '',
    tag: serializedTag,
  }
}

type TagOption = { _id?: string; title: string }

export function resolveDraftTag(
  draftTag: SubmitPostDraft['tag'],
  options: TagOption[]
): SubmitPostFormValues['tag'] {
  if (draftTag == null) return undefined

  if (typeof draftTag === 'string') {
    const trimmed = draftTag.trim()
    if (!trimmed) return undefined
    const match = options.find((option) => option._id === trimmed || option.title === trimmed)
    return match ?? { title: trimmed }
  }

  const trimmedTitle = draftTag.title.trim()
  if (!trimmedTitle) return undefined

  if (draftTag._id) {
    const match = options.find((option) => option._id === draftTag._id)
    return match ?? { _id: draftTag._id, title: trimmedTitle }
  }

  const match = options.find((option) => option.title === trimmedTitle)
  return match ?? { title: trimmedTitle }
}

export function draftToFormValues(
  draft: SubmitPostDraft,
  options: TagOption[]
): SubmitPostFormValues {
  return {
    title: draft.title,
    text: draft.text,
    citationUrl: draft.citationUrl,
    attribution: draft.attribution,
    tag: resolveDraftTag(draft.tag, options),
  }
}
