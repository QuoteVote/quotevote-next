/**
 * Zod validation schema for submit post form
 */

import { z } from 'zod'
import { containsUrl, sanitizeUrl } from '@/lib/utils/sanitizeUrl'

export const submitPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title should be less than 200 characters'),
  text: z
    .string()
    .min(1, 'Post content is required')
    .max(10000, 'Post content should be less than 10000 characters')
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
  group: z
    .union([
      z.object({
        _id: z.string(),
        title: z.string(),
      }),
      z.object({
        title: z.string().min(1, 'Group name cannot be empty'),
      }),
      z.string().min(1, 'Please select or create a group'),
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
      { message: 'Please select or create a group' }
    ),
})

export type SubmitPostFormValues = z.infer<typeof submitPostSchema>
