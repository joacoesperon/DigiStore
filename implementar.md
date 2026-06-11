# Plan de implementación — Cierre del objetivo OE-09 y mejoras de catálogo

> **Lector objetivo:** agente de IA que ejecutará estas tareas. Seguí las convenciones del repo al pie de la letra. No introduzcas dependencias nuevas. Compilá con `npm run build` al final de cada tarea para validar tipos.

## Contexto del proyecto

DigiStore: plataforma Next.js 16 (App Router) + Supabase (Postgres + Auth + Storage, con RLS) + Stripe + Tailwind v4 + shadcn/ui. TypeScript en todo.

Estas tareas cierran el objetivo **OE-09** del TFG ("panel de administración que permita la gestión completa de productos, planes, currículos, licencias, órdenes, cupones, **reseñas** y **clientes**") y añaden dos mejoras de catálogo. La tarea de "gráficas de revenue" queda **excluida** (trabajo futuro).

### Convenciones OBLIGATORIAS del repo

1. **Tres clientes de Supabase** (no mezclar):
   - `createClient()` — `await`, en `@/lib/supabase/server` (server) o `@/lib/supabase/client` (browser). Lee cookies del usuario, sujeto a RLS. Para sesión de usuario.
   - `createServiceClient()` — síncrono, `@/lib/supabase/server`. Service role, bypasa RLS. Para páginas admin y rutas que necesitan ver datos de todos.
   - `createAdminClient()` — `@/lib/supabase/admin`. Solo webhooks.
2. **Anti-IDOR**: toda ruta de API de usuario filtra por `user_id` además de por el id del recurso. Nunca confíes en un id que venga del cliente sin verificar pertenencia.
3. **Dinero en centavos** (entero). `formatCurrency(value)` de `@/lib/utils/formatters` YA divide por 100 internamente — NUNCA le pases `value / 100`.
4. **UI en inglés**. Las etiquetas visibles están en inglés ("Reviews", "Customers", "Approve", "No customers yet."). Mantené ese idioma.
5. **Validación con Zod** centralizada en `@/lib/utils/validators.ts`. El `reviewSchema` YA existe.
6. **Mutaciones desde el cliente**: componentes `'use client'` con `useState` para loading, `toast` de `sonner` para feedback, y `router.refresh()` de `next/navigation` tras la mutación. Ver `components/admin/ApproveReviewButton.tsx` y `components/admin/RevokeDialog.tsx` como patrones canónicos.
7. **Tipos** desde `@/types` (`import type { ... }`). `Review`, `Product`, `Profile`, `License`, `OrderWithItems` ya existen.
8. **Acciones destructivas** con confirmación: usar `@/components/ui/alert-dialog` (ya instalado).

### Datos relevantes ya existentes

- Tabla `reviews` (en `supabase/migration.sql`): columnas `id, product_id, user_id, license_id (NOT NULL), rating (1-5), title, body, is_approved (default false), created_at`. Constraint `unique (user_id, product_id)` → un usuario solo puede reseñar un producto una vez.
- RLS de `reviews`: "Anyone reads approved reviews" (`is_approved = true`), "Users manage own reviews" (`user_id = auth.uid()` para ALL), "Admin manages all reviews".
- `reviewSchema` en validators.ts: `{ rating: int 1-5, title?: max 100, body?: max 1000 }`.
- Tipo: `export type Review = Database['public']['Tables']['reviews']['Row']` en `types/index.ts`.

---

## TAREA 1 — Botón Rechazar/Eliminar en moderación de reseñas (admin)

**Objetivo:** En `app/admin/reviews/page.tsx` solo existe "Approve" (`components/admin/ApproveReviewButton.tsx`). Falta poder rechazar/eliminar una reseña, tanto pendiente como aprobada. Esto completa la "gestión completa de reseñas" del OE-09.

**Decisión de diseño:** "Rechazar/Eliminar" = borrar la fila de `reviews` (no hay estado intermedio "rejected" en el esquema, y añadir uno complicaría sin beneficio). Una reseña rechazada simplemente se elimina; el usuario podría volver a escribir otra. Borrado con confirmación (AlertDialog) por ser destructivo e irreversible.

### Paso 1.1 — Crear `components/admin/DeleteReviewButton.tsx`

Componente cliente. Sigue el patrón de `ApproveReviewButton.tsx` (cliente Supabase directo — la RLS "Admin manages all reviews" permite el delete) pero envuelto en un `AlertDialog` de confirmación.

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function remove() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Review deleted')
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this review?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the review. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

> Verificá las exportaciones reales de `@/components/ui/alert-dialog` antes de importar; usa exactamente los nombres que exporte ese archivo.

### Paso 1.2 — Conectar en `app/admin/reviews/page.tsx`

- Importar `DeleteReviewButton`.
- En la tabla **Pending**: en la celda de acciones (la última `<TableCell>`), junto a `<ApproveReviewButton>`, añadir `<DeleteReviewButton reviewId={review.id} />`. Envolvé ambos en un `<div className="flex items-center justify-end gap-2">`.
- En la tabla **Approved**: actualmente NO tiene columna de acciones. Añadir una `<TableHead />` extra al final del header y una `<TableCell className="text-right">` con `<DeleteReviewButton reviewId={review.id} />` en cada fila. Esto permite eliminar también reseñas ya aprobadas.

### Verificación Tarea 1
- `npm run build` sin errores de tipos.
- En `/admin/reviews`: una reseña pendiente muestra "Approve" y "Reject"; al rechazar, desaparece tras confirmar. Una reseña aprobada muestra "Reject"; al eliminar, desaparece.

---

## TAREA 2 — Página de detalle de cliente (admin)

**Objetivo:** `app/admin/customers/page.tsx` es solo una lista. Falta el detalle por cliente con sus licencias y órdenes. Completa la "gestión completa de clientes" del OE-09.

**Patrón de referencia:** `app/admin/licenses/[id]/page.tsx` (Server Component que hace fetch con `createServiceClient()` y arma cards/tablas).

### Paso 2.1 — Hacer las filas de la lista enlazables

En `app/admin/customers/page.tsx`, envolver el contenido de cada fila para que lleve a `/admin/customers/[id]`. La forma menos disruptiva: importar `Link` de `next/link` y convertir la celda del nombre en un enlace, o hacer la fila clickeable. Mínimo aceptable: el nombre del cliente es un `<Link href={`/admin/customers/${customer.id}`} className="hover:underline">`.

### Paso 2.2 — Crear `app/admin/customers/[id]/page.tsx`

Server Component. Estructura:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_COLORS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import type { Profile, License, Product, LicensePlan, OrderWithItems } from '@/types'
import { ArrowLeft } from 'lucide-react'

type LicenseRow = License & {
  products: Pick<Product, 'id' | 'name' | 'slug' | 'type'>
  license_plans: Pick<LicensePlan, 'id' | 'name'>
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (!profileData) notFound()
  const customer = profileData as Profile

  const { data: licensesData } = await supabase
    .from('licenses')
    .select('*, products(id, name, slug, type), license_plans(id, name)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  const licenses = (licensesData ?? []) as unknown as LicenseRow[]

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name))')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  const orders = (ordersData ?? []) as OrderWithItems[]

  // Renderizar:
  //  - Botón volver a /admin/customers (ArrowLeft)
  //  - Card con info del cliente: full_name, email, role (Badge), created_at (formatDate)
  //  - Sección "Licenses": tabla con producto (Link a /admin/licenses/[license.id]), plan,
  //    status (Badge con LICENSE_STATUS_COLORS/LABELS), fecha. Mensaje vacío si no hay.
  //  - Sección "Orders": tabla con id corto, total (formatCurrency(order.total_amount)),
  //    status (Badge con ORDER_STATUS_*), fecha. Link a /admin/orders si existe detalle, o mostrar inline.
  //    Mensaje vacío si no hay.
  return ( /* ...JSX siguiendo el layout de app/admin/licenses/[id]/page.tsx... */ )
}
```

**Notas:**
- Reutilizá `formatCurrency` para los totales de órdenes (en centavos, sin dividir).
- Verificá los nombres exactos de los exports de `@/types` (`OrderWithItems`, `LICENSE_STATUS_LABELS`, etc.) — ya se usan en `app/admin/orders/page.tsx` y `app/admin/licenses/[id]/page.tsx`; copiá de ahí.
- No necesitás ruta de API: es solo lectura con `createServiceClient()`.

### Verificación Tarea 2
- `npm run build` ok.
- `/admin/customers` → click en un cliente → `/admin/customers/[id]` muestra info + licencias + órdenes de ESE cliente.
- Un cliente sin licencias/órdenes muestra los mensajes de vacío, no rompe.

---

## TAREA 3 — Formulario de reseñas para usuarios

**Objetivo:** Hoy existe la tabla `reviews`, su RLS, el `reviewSchema` y toda la moderación admin, pero **ningún usuario puede crear una reseña** y **no se muestran reseñas en la página de producto**. Esto deja la moderación del OE-09 sin sentido (se modera algo que nadie crea). Implementar el ciclo completo.

**Gating (reglas de quién puede reseñar):** el usuario debe (a) estar autenticado, (b) tener al menos una licencia para ese producto (cualquier status), y (c) no haber reseñado ya ese producto (constraint `unique(user_id, product_id)`). La reseña requiere `license_id` (NOT NULL), que se asigna **en el servidor**, nunca desde el cliente (anti-IDOR).

### Paso 3.1 — Crear ruta de API `app/api/products/[productId]/reviews/route.ts`

`POST`. Patrón de referencia: `app/api/courses/[productId]/progress/route.ts` (auth con `createClient`, datos con `createServiceClient`, verificación anti-IDOR).

```ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { reviewSchema } from '@/lib/utils/validators'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = reviewSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review data' }, { status: 400 })
  }

  const service = createServiceClient()

  // Anti-IDOR: el usuario debe tener una licencia para este producto. license_id se fija en servidor.
  const { data: license } = await service
    .from('licenses')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!license) {
    return NextResponse.json({ error: 'You need a license for this product to review it' }, { status: 403 })
  }

  // Insert. is_approved=false por defecto (requiere moderación admin).
  // El unique(user_id, product_id) bloquea reseñas duplicadas → devolver 409.
  const { error } = await service.from('reviews').insert({
    product_id: productId,
    user_id: user.id,
    license_id: license.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body ?? null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already reviewed this product' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

> `23505` es el código Postgres de violación de unique. Verificá que el insert no falle por columnas faltantes (el esquema permite `title`/`body` NULL).

### Paso 3.2 — Crear `components/store/ReviewForm.tsx`

Componente cliente con `react-hook-form` + `zodResolver(reviewSchema)`. Patrón de formulario: `app/dashboard/profile/page.tsx`. Incluye:
- Un selector de rating de 1 a 5 estrellas (botones con icono `Star` de `lucide-react`; al hacer click setea el valor via `setValue('rating', n)`; `rating` se registra pero su input puede ser oculto o controlado).
- Input de `title` (opcional).
- Textarea de `body` (opcional).
- Submit que hace `fetch('/api/products/${productId}/reviews', { method: 'POST', body: JSON.stringify(values) })`.
- Manejo de respuestas: 201 → `toast.success('Review submitted for approval')` + `router.refresh()`; 409 → toast con el mensaje del JSON; otros → toast de error genérico leyendo `data.error`.

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { reviewSchema, type ReviewFormValues } from '@/lib/utils/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'

export default function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const {
    register, handleSubmit, setValue, formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema) })

  function pick(n: number) {
    setRating(n)
    setValue('rating', n, { shouldValidate: true })
  }

  async function onSubmit(values: ReviewFormValues) {
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? 'Could not submit review')
      return
    }
    toast.success('Review submitted for approval')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {/* estrellas */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => pick(n)} aria-label={`${n} stars`}>
            <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>
      {errors.rating && <p className="text-sm text-destructive">Select a rating</p>}
      <input type="hidden" {...register('rating', { valueAsNumber: true })} />
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input id="title" {...register('title')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Review (optional)</Label>
        <Textarea id="body" rows={4} {...register('body')} />
      </div>
      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting ? 'Submitting...' : 'Submit review'}
      </Button>
    </form>
  )
}
```

### Paso 3.3 — Mostrar reseñas y el formulario en `app/products/[slug]/page.tsx`

La página ya es Server Component y ya obtiene `user` y las licencias del usuario para el producto. Añadir:

1. **Fetch de reseñas aprobadas** del producto (con `createServiceClient`, que ya está como `supabase`):
   ```ts
   const { data: approvedReviews } = await supabase
     .from('reviews')
     .select('id, rating, title, body, created_at')
     .eq('product_id', p.id)
     .eq('is_approved', true)
     .order('created_at', { ascending: false })
   ```
2. **Determinar elegibilidad** para reseñar:
   - `hasLicense`: ¿el usuario tiene alguna licencia para este producto? Reutilizá una query: cualquier fila en `licenses` con `user_id = user.id` y `product_id = p.id` (cualquier status). Podés derivarlo de una query nueva o ampliar las existentes.
   - `alreadyReviewed`: ¿existe una reseña de este usuario para este producto?
     ```ts
     // solo si user existe
     const { data: myReview } = await supabase
       .from('reviews')
       .select('id')
       .eq('user_id', user.id)
       .eq('product_id', p.id)
       .maybeSingle()
     ```
   - `canReview = !!user && hasLicense && !myReview`
3. **Render** de una nueva sección "Reviews" al final del JSX (después de `PlanSelector`), con su `<Separator>`:
   - Lista de `approvedReviews` (estrellas con `rating`, `title`, `body`, fecha con `formatDate`). Si no hay, "No reviews yet."
   - Si `canReview`: renderizar `<ReviewForm productId={p.id} />` bajo un encabezado "Write a review".
   - Si `user && alreadyReviewed`: texto "You already reviewed this product."
   - Si `user && !hasLicense`: no mostrar formulario (opcionalmente, texto "Purchase this product to leave a review.").
   - Importar `formatDate` de `@/lib/utils/formatters` y `ReviewForm` de `@/components/store/ReviewForm`.

### Verificación Tarea 3
- `npm run build` ok.
- Con un usuario CON licencia del producto y SIN reseña previa: aparece el formulario; al enviar, toast de éxito y la reseña queda pendiente (no visible aún, porque `is_approved=false`).
- En `/admin/reviews` aparece esa reseña como pendiente; al aprobarla, pasa a verse en `/products/[slug]`.
- Reintentar reseñar el mismo producto → 409 "You already reviewed this product".
- Usuario sin licencia → no ve el formulario; si fuerza el POST, recibe 403.

---

## TAREA 4 — Búsqueda por nombre en el catálogo público

**Objetivo:** `app/products/page.tsx` ya filtra por tipo (`?type=`). Añadir búsqueda por nombre (`?q=`). NO está comprometido en ningún objetivo, pero es una mejora menor y de bajo riesgo.

### Paso 4.1 — Modificar `app/products/page.tsx`

1. Ampliar `SearchParams`: `{ type?: string; q?: string }` y desestructurar `q`.
2. Añadir filtro a la query si `q` tiene contenido:
   ```ts
   if (q && q.trim()) {
     query = query.ilike('name', `%${q.trim()}%`)
   }
   ```
   (`.ilike` es case-insensitive en PostgREST.)
3. Añadir un formulario de búsqueda (GET, sin JS) sobre la grilla, que preserve el `type` actual:
   ```tsx
   <form method="get" action="/products" className="mb-6 flex gap-2 max-w-sm">
     {type && <input type="hidden" name="type" value={type} />}
     <input
       type="text"
       name="q"
       defaultValue={q ?? ''}
       placeholder="Search products..."
       className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
     />
     <button type="submit" className="...estilos de Button...">Search</button>
   </form>
   ```
   Preferible: usar el componente `Input` de `@/components/ui/input` y `Button` de `@/components/ui/button` (con `type="submit"`). Como la página es Server Component, un `<form method="get">` funciona sin JavaScript.
4. **Importante sobre las tabs de tipo:** los enlaces de tipo actuales son `<a href="/products?type=...">`, que descartan el `q`. Es aceptable que cambiar de tipo reinicie la búsqueda. Si querés preservar `q` al cambiar de tipo, construí los `href` como `/products?type=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`. Implementá esta versión que preserva `q`.

### Verificación Tarea 4
- `npm run build` ok.
- `/products?q=algo` filtra por nombre (case-insensitive).
- `/products?type=software&q=algo` combina ambos filtros.
- Cambiar de pestaña de tipo conserva el término de búsqueda.

---

## Cierre

Tras completar las 4 tareas:
1. `npm run build` final sin errores ni warnings de tipos.
2. `npm run lint`.
3. Probar manualmente los flujos de cada "Verificación".
4. Actualizar `todo.md`: marcar como hechas las tareas de reseñas (usuario + admin reject), detalle de cliente y búsqueda de catálogo. Dejar "Gráficas de revenue" como pendiente/nice-to-have.
5. Añadir una entrada en `diario.md` resumiendo los cambios (seguí el formato de las sesiones existentes), porque la memoria del TFG se nutre de ese diario.

### Impacto en los objetivos del TFG
- **Tareas 1 + 2 + 3** → cierran **OE-09** al 100% (gestión completa de reseñas y clientes, con el ciclo de reseñas funcionando de punta a punta).
- **Tarea 4** → mejora no comprometida en objetivos; refuerza OE-02 (catálogo).
