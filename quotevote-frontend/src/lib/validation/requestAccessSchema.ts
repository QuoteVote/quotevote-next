/**
 * Zod validation schemas for RequestAccess forms
 */

import { z } from 'zod';

/**
 * Email validation pattern matching the original regex
 */
const EMAIL_PATTERN = /^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i;

/**
 * Schema for email-only request access form
 */
export const requestAccessEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(EMAIL_PATTERN, 'Please enter a valid email address'),
});

export type RequestAccessEmailFormData = z.infer<typeof requestAccessEmailSchema>;

/**
 * Schema for personal form (first step)
 */
export const personalFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First Name is required')
    .min(1, 'First Name should be more than 1 character')
    .max(20, 'First Name should be less than twenty characters'),
  lastName: z
    .string()
    .min(1, 'Last Name is required')
    .min(1, 'Last Name should be more than 1 character')
    .max(20, 'Last Name should be less than twenty characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

export type PersonalFormData = z.infer<typeof personalFormSchema>;

/**
 * Schema for business form (first step)
 */
export const businessFormSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full Name is required')
    .min(1, 'Full Name should be more than 1 character')
    .max(20, 'Full Name should be less than twenty characters'),
  companyName: z
    .string()
    .min(1, 'Company Name is required')
    .min(1, 'Company Name should be more than 1 character')
    .max(20, 'Company Name should be less than twenty characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

export type BusinessFormData = z.infer<typeof businessFormSchema>;

/**
 * Schema for payment method form
 */
export const paymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^[\d\s]{13,19}$/, 'Invalid card number'),
  expiry: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^\d{2}\/\d{2}$/, 'Invalid expiry date (MM/YY format)'),
  cvv: z
    .string()
    .min(1, 'CVC is required')
    .regex(/^\d{3,4}$/, 'Invalid CVC'),
  cost: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Optional for business plan
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Cost must be a valid number' }
    ),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

