// Este archivo se genera automáticamente con:
//   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
//
// Reemplaza este contenido con los tipos generados una vez que tengas
// el proyecto de Supabase configurado.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'customer'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          type: 'software' | 'ebook' | 'course' | 'template'
          status: 'draft' | 'published' | 'archived'
          thumbnail_url: string | null
          file_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          type: 'software' | 'ebook' | 'course' | 'template'
          status?: 'draft' | 'published' | 'archived'
          thumbnail_url?: string | null
          file_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          type?: 'software' | 'ebook' | 'course' | 'template'
          status?: 'draft' | 'published' | 'archived'
          thumbnail_url?: string | null
          file_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      license_plans: {
        Row: {
          id: string
          product_id: string
          name: string
          type: 'perpetual' | 'subscription' | 'trial'
          price: number
          currency: string
          billing_interval: 'month' | 'year' | null
          trial_days: number | null
          max_activations: number
          features: Json
          is_active: boolean
          stripe_price_id: string | null
          stripe_product_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          type: 'perpetual' | 'subscription' | 'trial'
          price: number
          currency?: string
          billing_interval?: 'month' | 'year' | null
          trial_days?: number | null
          max_activations?: number
          features?: Json
          is_active?: boolean
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          type?: 'perpetual' | 'subscription' | 'trial'
          price?: number
          currency?: string
          billing_interval?: 'month' | 'year' | null
          trial_days?: number | null
          max_activations?: number
          features?: Json
          is_active?: boolean
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'license_plans_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'completed' | 'refunded' | 'failed'
          total_amount: number
          discount_amount: number
          stripe_session_id: string | null
          stripe_payment_intent: string | null
          stripe_subscription_id: string | null
          coupon_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'completed' | 'refunded' | 'failed'
          total_amount: number
          discount_amount?: number
          stripe_session_id?: string | null
          stripe_payment_intent?: string | null
          stripe_subscription_id?: string | null
          coupon_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'completed' | 'refunded' | 'failed'
          total_amount?: number
          discount_amount?: number
          stripe_session_id?: string | null
          stripe_payment_intent?: string | null
          stripe_subscription_id?: string | null
          coupon_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_coupon_id_fkey'
            columns: ['coupon_id']
            isOneToOne: false
            referencedRelation: 'coupons'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          license_plan_id: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          license_plan_id: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          license_plan_id?: string
          price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_license_plan_id_fkey'
            columns: ['license_plan_id']
            isOneToOne: false
            referencedRelation: 'license_plans'
            referencedColumns: ['id']
          }
        ]
      }
      licenses: {
        Row: {
          id: string
          license_key: string
          user_id: string
          product_id: string
          license_plan_id: string
          order_item_id: string | null
          status: 'active' | 'expired' | 'revoked' | 'suspended' | 'trial'
          type: 'perpetual' | 'subscription' | 'trial'
          max_activations: number
          activation_count: number
          issued_at: string
          expires_at: string | null
          revoked_at: string | null
          revocation_reason: string | null
          stripe_subscription_id: string | null
          cancel_at_period_end: boolean
          hidden: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          license_key: string
          user_id: string
          product_id: string
          license_plan_id: string
          order_item_id?: string | null
          status?: 'active' | 'expired' | 'revoked' | 'suspended' | 'trial'
          type: 'perpetual' | 'subscription' | 'trial'
          max_activations?: number
          activation_count?: number
          issued_at?: string
          expires_at?: string | null
          revoked_at?: string | null
          revocation_reason?: string | null
          stripe_subscription_id?: string | null
          cancel_at_period_end?: boolean
          hidden?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          license_key?: string
          user_id?: string
          product_id?: string
          license_plan_id?: string
          order_item_id?: string | null
          status?: 'active' | 'expired' | 'revoked' | 'suspended' | 'trial'
          type?: 'perpetual' | 'subscription' | 'trial'
          max_activations?: number
          activation_count?: number
          issued_at?: string
          expires_at?: string | null
          revoked_at?: string | null
          revocation_reason?: string | null
          stripe_subscription_id?: string | null
          cancel_at_period_end?: boolean
          hidden?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'licenses_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'licenses_license_plan_id_fkey'
            columns: ['license_plan_id']
            isOneToOne: false
            referencedRelation: 'license_plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'licenses_order_item_id_fkey'
            columns: ['order_item_id']
            isOneToOne: false
            referencedRelation: 'order_items'
            referencedColumns: ['id']
          }
        ]
      }
      license_activations: {
        Row: {
          id: string
          license_id: string
          machine_id: string
          machine_name: string | null
          ip_address: string | null
          is_active: boolean
          first_activated_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          license_id: string
          machine_id: string
          machine_name?: string | null
          ip_address?: string | null
          is_active?: boolean
          first_activated_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          license_id?: string
          machine_id?: string
          machine_name?: string | null
          ip_address?: string | null
          is_active?: boolean
          first_activated_at?: string
          last_seen_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'license_activations_license_id_fkey'
            columns: ['license_id']
            isOneToOne: false
            referencedRelation: 'licenses'
            referencedColumns: ['id']
          }
        ]
      }
      license_events: {
        Row: {
          id: string
          license_id: string
          event_type:
            | 'issued'
            | 'activated'
            | 'deactivated'
            | 'verified'
            | 'expired'
            | 'revoked'
            | 'suspended'
            | 'renewed'
            | 'reactivated'
          machine_id: string | null
          ip_address: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          license_id: string
          event_type:
            | 'issued'
            | 'activated'
            | 'deactivated'
            | 'verified'
            | 'expired'
            | 'revoked'
            | 'suspended'
            | 'renewed'
            | 'reactivated'
          machine_id?: string | null
          ip_address?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          license_id?: string
          event_type?:
            | 'issued'
            | 'activated'
            | 'deactivated'
            | 'verified'
            | 'expired'
            | 'revoked'
            | 'suspended'
            | 'renewed'
            | 'reactivated'
          machine_id?: string | null
          ip_address?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'license_events_license_id_fkey'
            columns: ['license_id']
            isOneToOne: false
            referencedRelation: 'licenses'
            referencedColumns: ['id']
          }
        ]
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount: number | null
          max_uses: number | null
          used_count: number
          is_active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount?: number | null
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percentage' | 'fixed'
          value?: number
          min_order_amount?: number | null
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          license_id: string
          rating: number
          title: string | null
          body: string | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          license_id: string
          rating: number
          title?: string | null
          body?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          license_id?: string
          rating?: number
          title?: string | null
          body?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_license_id_fkey'
            columns: ['license_id']
            isOneToOne: false
            referencedRelation: 'licenses'
            referencedColumns: ['id']
          }
        ]
      }
      course_modules: {
        Row: {
          id: string
          product_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_modules_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      course_lessons: {
        Row: {
          id: string
          module_id: string
          product_id: string
          title: string
          video_url: string | null
          content: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          product_id: string
          title: string
          video_url?: string | null
          content?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          product_id?: string
          title?: string
          video_url?: string | null
          content?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_lessons_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'course_modules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_lessons_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      course_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          product_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          product_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          product_id?: string
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'course_lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_progress_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
