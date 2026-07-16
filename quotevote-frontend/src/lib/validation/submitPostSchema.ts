/**
 * Zod validation schema for submit post form
 */

import { z } from 'zod'
import { containsUrl, sanitizeUrl } from '@/lib/utils/sanitizeUrl'
import { ATTRIBUTION_MAX_LENGTH } from '@/lib/constants/attribution'
import { SUBMIT_POST_TITLE_MAX_LENGTH } from '@/lib/constants/submitPost'

export const submitPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(SUBMIT_POST_TITLE_MAX_LENGTH, `Title should be less than ${SUBMIT_POST_TITLE_MAX_LENGTH} characters`),
  text: z
    .string()
    .min(1, 'Post content is required')
    .refine(
      (value) => !containsUrl(value),
      {
        message: 'Links are not allowed in the post body. Use the Citation URL field instead.',
      }
    ),
  citationUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || sanitizeUrl(value) !== null,
      {
        message: 'Invalid URL format. Please enter a valid http or https URL.',
      }
    ),
  attribution: z
    .string()
    .max(ATTRIBUTION_MAX_LENGTH, `Attribution should be less than ${ATTRIBUTION_MAX_LENGTH} characters`)
    .optional(),
  tag: z
    .union([
      z.object({
        _id: z.string(),
        title: z.string(),
      }),
      z.object({
        title: z.string().min(1, 'Tag name cannot be empty'),
      }),
      z.string().min(1, 'Please select or create a tag'),
    ])
    .optional()
    .refine(
      (value) => {
        if (!value) return false
        if (typeof value === 'string') return value.trim().length > 0
        if (typeof value === 'object' && 'title' in value)
          return (value as { title: string }).title.trim().length > 0
        return false
      },
      { message: 'Please select or create a tag' }
    ),
})

export type SubmitPostFormValues = z.infer<typeof submitPostSchema>

export function isSubmitPostFormReady(values: SubmitPostFormValues): boolean {
  return submitPostSchema.safeParse(values).success
}
