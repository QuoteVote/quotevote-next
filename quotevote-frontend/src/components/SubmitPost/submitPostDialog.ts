/**
 * Shared DialogContent classes for Create Quote across all hosts. The layout lives in
 * `.qv-compose` (globals.css): full screen on phones, the design's 1120×880 two-column
 * dialog on larger screens, in all four themes.
 *
 * `translate-x-0 translate-y-0` replace the shared dialog's -50% shift (tailwind-merge
 * drops the conflicting classes). A `translate: none` in the stylesheet isn't enough: the
 * production CSS minifier folds it into `transform` and the shift comes back.
 */
export const SUBMIT_POST_DIALOG_CLASS =
  'qv-auth qv-compose font-redesign z-[70] gap-0 p-0 translate-x-0 translate-y-0'

/** The dimmed, blurred page behind the Create Quote dialog. */
export const SUBMIT_POST_OVERLAY_CLASS = 'qv-compose-scrim z-[70]'
