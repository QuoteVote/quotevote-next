/**
 * Zod validation schema for login form
 */

import { z } from 'zod';

export const loginSchema = z.object({
    username: z
        .string()
        .min(4, 'Username should be more than 4 characters')
        .max(30, 'Username should be less than thirty characters'),
    password: z
        .string()
        .min(2, 'Password should be more than 2 characters')
        .max(20, 'Password should be less than twenty characters'),
    tos: z
        .boolean()
        .refine((val) => val === true, {
            message: 'Acceptance required',
        }),
    coc: z
        .boolean()
        .refine((val) => val === true, {
            message: 'Acceptance required',
        }),
});

