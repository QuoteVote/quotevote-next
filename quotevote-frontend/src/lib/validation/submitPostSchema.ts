/**
 * Zod validation schema for submit post form
 */

import { z } from 'zod'

export const submitPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title should be less than 200 characters'),
  text: z
    .string()
    .min(1, 'Post content is required')
    .max(10000, 'Post content should be less than 10000 characters'),
  group: z
    .union([
      z.object({
        _id: z.string(),
        title: z.string(),
      }),
      z.object({
        title: z.string().min(1, 'Group name is required'),
      }),
      z.string().min(1, 'Group selection is required'),
    ])
    .optional()
    .refine(
      (value) => {
        if (!value) return false
        if (typeof value === 'string') {
          return value.trim().length > 0
        }
        if (value && 'title' in value) {
          return value.title.trim().length > 0
        }
        return false
      },
      {
        message: 'Group selection is required',
      }
    ),
})

export type SubmitPostFormValues = z.infer<typeof submitPostSchema>

