import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, Code, Layout, Video, ShieldCheck, Zap, Globe } from 'lucide-react'
import ProductGrid from '@/components/store/ProductGrid'
import type { Product, LicensePlan } from '@/types'

type ProductWithPlans = Product & { license_plans: LicensePlan[] }

const CATEGORIES_DISPLAY = [
  { type: 'ebook', label: 'Ebooks & PDFs', icon: BookOpen, description: 'Guides, books and digital documents' },
  { type: 'course', label: 'Courses & Videos', icon: Video, description: 'Learn with structured content' },
  { type: 'software', label: 'Software & Apps', icon: Code, description: 'Tools and applications' },
  { type: 'template', label: 'Templates', icon: Layout, description: 'Figma, web, document templates' },
] as const

export default async function HomePage() {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const { data: products } = await supabase
    .from('products')
    .select('*, license_plans(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)

  const featured = (products ?? []) as ProductWithPlans[]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-4 py-20 md:py-32 text-center bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">License Management Platform</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Secure Licenses for{' '}
            <span className="text-primary">Digital Products</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Purchase perpetual or subscription licenses. Activate on your machines,
            validate remotely via API, and manage everything from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">
                Browse products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!user && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/register">Create account</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 border-b">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Secure License Keys</h3>
              <p className="text-sm text-muted-foreground">Cryptographically random keys. Validate from any software via REST API.</p>
            </div>
            <div>
              <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Flexible Licensing</h3>
              <p className="text-sm text-muted-foreground">Perpetual, subscription, or time-limited trial — pick the model you need.</p>
            </div>
            <div>
              <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Remote Validation API</h3>
              <p className="text-sm text-muted-foreground">Use our public API to verify licenses from your app, desktop software, or CLI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Browse by type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES_DISPLAY.map(({ type, label, icon: Icon, description }) => (
              <Link
                key={type}
                href={`/products?type=${type}`}
                className="group flex flex-col items-center p-6 rounded-xl border bg-card hover:bg-accent transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold text-sm mb-1">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="px-4 py-16 bg-muted/20 border-t">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Featured products</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={featured} />
          </div>
        </section>
      )}
    </div>
  )
}
