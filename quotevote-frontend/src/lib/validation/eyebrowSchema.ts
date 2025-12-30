/**
 * Zod validation schema for eyebrow form
 */

import { z } from "zod";

export const eyebrowSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});
