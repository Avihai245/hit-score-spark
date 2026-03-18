/**
 * Input Validation Schemas
 * Security: Validate all user inputs before processing
 */

import { z } from 'zod';

// ============================================================================
// Basic Types
// ============================================================================

export const planSchema = z.enum(['free', 'pro', 'studio', 'business', 'unlimited']);
export type Plan = z.infer<typeof planSchema>;

export const creditSchema = z.number().int().min(0).max(1000000).safe();
export const emailSchema = z.string().email().toLowerCase().max(255);
export const userIdSchema = z.string().uuid();
export const stringSchema = z.string().trim().min(1).max(1000);

// ============================================================================
// Password Validation
// ============================================================================

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    'Password must contain an uppercase letter'
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    'Password must contain a lowercase letter'
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    'Password must contain a number'
  )
  .refine(
    (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    'Password must contain a special character'
  );

// ============================================================================
// Authentication Schemas
// ============================================================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

// ============================================================================
// Admin Action Schemas
// ============================================================================

export const updateUserPlanSchema = z.object({
  userId: userIdSchema,
  newPlan: planSchema,
});

export type UpdateUserPlanInput = z.infer<typeof updateUserPlanSchema>;

export const addCreditsSchema = z.object({
  userId: userIdSchema,
  amount: z.number().int().min(1).max(100000),
});

export type AddCreditsInput = z.infer<typeof addCreditsSchema>;

export const deleteUserSchema = z.object({
  userId: userIdSchema,
  reason: z.string().min(1).max(500),
  confirmDelete: z.boolean().refine((val) => val === true, {
    message: 'Must confirm deletion',
  }),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

// ============================================================================
// Analysis & Remix Schemas
// ============================================================================

export const createAnalysisSchema = z.object({
  title: z.string().min(1).max(255),
  genre: z.string().min(1).max(100),
  bpm: z.number().int().min(20).max(300).optional(),
  duration: z.number().int().min(1).max(3600).optional(),
  description: z.string().max(1000).optional(),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

export const createRemixSchema = z.object({
  analysisId: userIdSchema,
  title: z.string().min(1).max(255),
  lyrics: z.string().max(5000).optional(),
  style: z.string().min(1).max(100),
});

export type CreateRemixInput = z.infer<typeof createRemixSchema>;

// ============================================================================
// Billing Schemas
// ============================================================================

export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1),
  userId: userIdSchema,
  mode: z.enum(['subscription', 'payment']).default('subscription'),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

export const validate = <T,>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
};

export const validateOrThrow = <T,>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// ============================================================================
// Specific Validators
// ============================================================================

export const validatePlan = (plan: unknown) => validate(planSchema, plan);
export const validateEmail = (email: unknown) => validate(emailSchema, email);
export const validateUserId = (id: unknown) => validate(userIdSchema, id);
export const validatePassword = (pwd: unknown) => validate(passwordSchema, pwd);
export const validateCredits = (credits: unknown) => validate(creditSchema, credits);

// ============================================================================
// Batch Validation
// ============================================================================

export const validateMultiple = (
  validations: { key: string; value: unknown; schema: z.ZodSchema }[]
): { success: boolean; errors?: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const { key, value, schema } of validations) {
    const result = validate(schema, value);
    if (!result.success) {
      errors[key] = result.error || 'Invalid value';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true };
};
