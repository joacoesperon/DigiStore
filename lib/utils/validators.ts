import { z } from 'zod'

// ─── Productos ────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().optional(),
  short_description: z.string().max(280).optional(),
  type: z.enum(['ebook', 'course', 'software', 'template']),
  status: z.enum(['draft', 'published', 'archived']),
  thumbnail_url: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
})

export type ProductFormValues = z.infer<typeof productSchema>

// ─── Cupones ──────────────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(50)
    .toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(1, 'El valor debe ser mayor a 0'),
  min_order_amount: z.coerce.number().min(0).optional().nullable(),
  max_uses: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
  expires_at: z.string().optional().nullable(),
})

export type CouponFormValues = z.infer<typeof couponSchema>

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().max(1000).optional(),
})

export type ReviewFormValues = z.infer<typeof reviewSchema>

// ─── Perfil ───────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = loginSchema
  .extend({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

// Aliases for backward compatibility
export type LoginInput = LoginFormValues
export type RegisterInput = RegisterFormValues

// ─── Checkout API ─────────────────────────────────────────────────────────────

export const checkoutBodySchema = z.object({
  productId: z.string().uuid(),
  couponCode: z.string().optional(),
})

export const couponValidateBodySchema = z.object({
  code: z.string().min(1),
  productId: z.string().uuid(),
})

// ─── API v1 de licencias ──────────────────────────────────────────────────────

export const verifyLicenseSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  machine_id: z.string().max(256).optional(),
})

export const activateLicenseSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  machine_id: z.string().min(1, 'Machine ID is required').max(256),
  machine_name: z.string().max(100).optional(),
})

export const deactivateLicenseSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  machine_id: z.string().min(1, 'Machine ID is required').max(256),
})

// ─── Planes de licencia (admin) ───────────────────────────────────────────────

export const licensePlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(50),
  type: z.enum(['perpetual', 'subscription', 'trial']),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  currency: z.string().default('usd'),
  billing_interval: z.enum(['month', 'year']).optional().nullable(),
  trial_days: z.coerce.number().int().min(1).max(365).optional().nullable(),
  max_activations: z.coerce.number().int().min(1).max(100).default(1),
  features: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
})

export type LicensePlanFormValues = z.infer<typeof licensePlanSchema>
