import type { Database } from './database'

// ─── Row type helpers ─────────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type LicensePlan = Database['public']['Tables']['license_plans']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type License = Database['public']['Tables']['licenses']['Row']
export type LicenseActivation = Database['public']['Tables']['license_activations']['Row']
export type LicenseEvent = Database['public']['Tables']['license_events']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type CourseModule = Database['public']['Tables']['course_modules']['Row']
export type CourseLesson = Database['public']['Tables']['course_lessons']['Row']
export type CourseProgress = Database['public']['Tables']['course_progress']['Row']

// ─── Domain union types ───────────────────────────────────────────────────────

export type ProductType = 'software' | 'ebook' | 'course' | 'template'
export type ProductStatus = 'draft' | 'published' | 'archived'
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed'
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended' | 'trial'
export type LicenseType = 'perpetual' | 'subscription' | 'trial'
export type UserRole = 'admin' | 'customer'
export type CouponType = 'percentage' | 'fixed'

// ─── JOIN types ───────────────────────────────────────────────────────────────

export type ProductWithPlans = Product & {
  license_plans: LicensePlan[]
}

export type LicenseWithProduct = License & {
  products: Pick<Product, 'id' | 'name' | 'slug' | 'thumbnail_url' | 'type'>
  license_plans: Pick<LicensePlan, 'id' | 'name' | 'type' | 'billing_interval'>
}

export type LicenseWithActivations = License & {
  license_activations: LicenseActivation[]
  products: Pick<Product, 'id' | 'name' | 'slug' | 'thumbnail_url'>
  license_plans: Pick<LicensePlan, 'id' | 'name' | 'type' | 'max_activations'>
}

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    products: Pick<Product, 'id' | 'name' | 'slug' | 'thumbnail_url'>
    license_plans: Pick<LicensePlan, 'id' | 'name' | 'type'>
  })[]
}

export type ModuleWithLessons = CourseModule & {
  course_lessons: CourseLesson[]
}

// ─── API v1 response types ────────────────────────────────────────────────────

export interface LicenseVerifyResponse {
  valid: boolean
  status: LicenseStatus | 'not_found'
  type: LicenseType | null
  expires_at: string | null
  product: { id: string; name: string } | null
  activations: { current: number; max: number } | null
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutResponse {
  url: string
}

export interface CouponValidateResponse {
  valid: boolean
  coupon?: {
    id: string
    code: string
    type: CouponType
    value: number
    discountAmount: number
  }
  error?: string
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  activeLicenses: number
}

// ─── Label / color maps ───────────────────────────────────────────────────────

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  active: 'Active',
  trial: 'Trial',
  expired: 'Expired',
  revoked: 'Revoked',
  suspended: 'Suspended',
}

export const LICENSE_STATUS_COLORS: Record<LicenseStatus, string> = {
  active: 'text-green-700 bg-green-50 border-green-200',
  trial: 'text-blue-700 bg-blue-50 border-blue-200',
  expired: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  revoked: 'text-red-700 bg-red-50 border-red-200',
  suspended: 'text-orange-700 bg-orange-50 border-orange-200',
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  software: 'Software',
  ebook: 'Ebook',
  course: 'Curso',
  template: 'Plantilla',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  refunded: 'Reembolsado',
  failed: 'Fallido',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  completed: 'text-green-700 bg-green-50 border-green-200',
  refunded: 'text-blue-700 bg-blue-50 border-blue-200',
  failed: 'text-red-700 bg-red-50 border-red-200',
}
