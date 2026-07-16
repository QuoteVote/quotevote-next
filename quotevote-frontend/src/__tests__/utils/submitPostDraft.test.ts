import {
  clearSubmitPostDraft,
  formValuesToDraft,
  isSubmitPostDraftEmpty,
  readSubmitPostDraft,
  resolveDraftTag,
  writeSubmitPostDraft,
} from '@/lib/utils/submitPostDraft'

describe('submitPostDraft', () => {
  const userId = 'user-123'
  const storageKey = 'quotevote:submit-post-draft:user-123'
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
        clear: () => {
          store.clear()
        },
      },
    })
  })

  it('persists and restores draft values', () => {
    writeSubmitPostDraft(userId, {
      title: 'My quote',
      text: 'Quote body',
      citationUrl: 'https://example.com',
      attribution: 'Ada Lovelace',
      tag: { _id: 'tag-1', title: 'Public' },
    })

    expect(readSubmitPostDraft(userId)).toEqual({
      title: 'My quote',
      text: 'Quote body',
      citationUrl: 'https://example.com',
      attribution: 'Ada Lovelace',
      tag: { _id: 'tag-1', title: 'Public' },
    })
  })

  it('clears storage when draft is empty', () => {
    writeSubmitPostDraft(userId, {
      title: 'Draft',
      text: 'Body',
      citationUrl: '',
      attribution: '',
      tag: null,
    })
    expect(sessionStorage.getItem(storageKey)).not.toBeNull()

    writeSubmitPostDraft(userId, {
      title: '',
      text: '',
      citationUrl: '',
      attribution: '',
      tag: null,
    })

    expect(sessionStorage.getItem(storageKey)).toBeNull()
    expect(isSubmitPostDraftEmpty(readSubmitPostDraft(userId) ?? {
      title: '',
      text: '',
      citationUrl: '',
      attribution: '',
      tag: null,
    })).toBe(true)
  })

  it('serializes form values and resolves saved tags against options', () => {
    const draft = formValuesToDraft({
      title: 'Title',
      text: 'Body',
      citationUrl: '',
      attribution: '',
      tag: { _id: 'tag-1', title: 'Public' },
    })

    expect(draft.tag).toEqual({ _id: 'tag-1', title: 'Public' })
    expect(
      resolveDraftTag(draft.tag, [{ _id: 'tag-1', title: 'Public' }])
    ).toEqual({ _id: 'tag-1', title: 'Public' })
  })

  it('clearSubmitPostDraft removes saved draft', () => {
    writeSubmitPostDraft(userId, {
      title: 'Saved',
      text: 'Body',
      citationUrl: '',
      attribution: '',
      tag: 'New Tag',
    })

    clearSubmitPostDraft(userId)

    expect(readSubmitPostDraft(userId)).toBeNull()
  })
})
