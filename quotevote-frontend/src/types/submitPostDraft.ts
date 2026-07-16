export interface SubmitPostDraftTag {
  _id?: string
  title: string
}

export interface SubmitPostDraft {
  title: string
  text: string
  citationUrl: string
  attribution: string
  tag: SubmitPostDraftTag | string | null
}
