/**
 * Zod validation schema for signup form
 */

import { z } from 'zod';

export const signupSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    username: z
        .string()
        .min(4, 'Username should be more than 4 characters')
        .max(20, 'Username should be less than twenty characters'),
    password: z
        .string()
        .min(8, 'Password should be at least 8 characters')
        .max(20, 'Password should be less than twenty characters')
        .regex(
            /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
            'Password should contain a number, an uppercase, and lowercase letter'
        ),
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
