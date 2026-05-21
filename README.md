# DigiStore — Plataforma de Venta de Productos Digitales

## ¿Qué es DigiStore?

DigiStore es una **plataforma de venta y entrega de productos digitales**. No es un marketplace (como Gumroad o Etsy) — es una tienda privada de un solo vendedor. Un administrador gestiona el catálogo, los compradores acceden a su cuenta para descargar los productos y ver sus licencias.

El diferencial técnico central es la **entrega adaptativa por tipo de producto**: un mismo flujo de compra y panel de usuario soporta cuatro tipos de productos, cada uno con su propio mecanismo de distribución segura. Para software, genera claves de licencia únicas y expone una API pública de verificación remota. Para ebooks y plantillas, distribuye archivos mediante URLs firmadas de duración limitada. Para cursos, proporciona un visualizador integrado con reproducción de vídeo, Markdown, archivos adjuntos y seguimiento de progreso.

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Base de datos + Auth + Storage | Supabase |
| Pagos | Stripe (Checkout Sessions + Subscriptions + Webhooks) |
| Validación de forms | Zod + react-hook-form |
| Utilidades | date-fns, lucide-react, sonner |

---

## Modelos de venta soportados

| Tipo | Cómo funciona | Renovación |
|------|--------------|------------|
| Pago único (perpetual) | El usuario paga una vez y conserva el acceso para siempre | No aplica |
| Suscripción mensual/anual | Stripe cobra automáticamente. Si deja de pagar, la licencia expira | Automática vía webhook |
| Acceso de prueba (trial) | Gratis por X días configurados, sin Stripe | Expira automáticamente |

---

## Flujo completo de compra

```
Usuario → /products/[slug] → elige plan → POST /api/checkout
  ├─ Trial (precio $0): genera licencia directamente, sin Stripe
  └─ Pago/Suscripción → Stripe Checkout → pago exitoso
       └─ Stripe llama POST /api/webhooks/stripe
            └─ genera license key + guarda orden + licencia en DB
                 └─ Usuario va a /dashboard/licenses/[id]
                      └─ Botón "Download product" → GET /api/downloads/[productId]
                           └─ Verifica licencia activa → genera URL firmada (1h) → descarga
```

---

## Entrega de archivos

El administrador sube el archivo del producto (PDF, ZIP, .py, .ex4/.ex5, .exe, etc.) desde el panel admin al crear o editar un producto. El archivo se guarda en un bucket **privado** de Supabase Storage.

Cuando un usuario quiere descargar:
1. Hace click en "Download product" en su dashboard
2. La app verifica que tiene una licencia `active` o `trial` para ese producto
3. Genera una URL firmada que expira en 1 hora
4. El browser descarga el archivo directamente desde Supabase Storage

El archivo nunca es público — **solo usuarios con licencia válida pueden descargarlo**.

---

## Roles y accesos

| Ruta | Acceso |
|------|--------|
| `/`, `/products`, `/products/[slug]` | Público |
| `/auth/login`, `/auth/register` | Público |
| `/dashboard/**` | Usuario autenticado |
| `/admin/**` | Solo `role = 'admin'` |
| `/api/v1/licenses/**` | Público (rate limited) |
| `/api/downloads/**` | Autenticado + licencia activa |
| `/api/checkout` | Autenticado |
| `/api/webhooks/stripe` | Solo Stripe (HMAC) |
| `/api/admin/**` | Solo admin |

---

## Base de datos — tablas clave

| Tabla | Propósito |
|-------|-----------|
| `products` | Catálogo. Incluye `file_path` para el archivo descargable |
| `license_plans` | Planes por producto: precio, tipo, max_activations |
| `orders` / `order_items` | Historial de compras |
| `licenses` | Licencia activa por usuario/plan. Tiene `status`, `expires_at`, `activation_count` |
| `license_activations` | Máquinas registradas por licencia |
| `license_events` | Log de auditoría (issued, activated, verified, revoked…) |
| `coupons` | Descuentos |
| `reviews` | Reseñas de compradores verificados |

---

# DigiStore — Contexto del Proyecto

---

## Propósito

### 1. Trabajo de Fin de Grado (TFG)
DigiStore es el proyecto de titulación de Ingeniería Informática de Joaquín Esperon. El tema oficial es **"Desarrollo de plataforma de venta de productos digitales"**. Cubre las áreas técnicas de:
- Arquitectura serverless moderna (Next.js 16 App Router + Supabase + Stripe)
- Gestión de autenticación y roles (Supabase Auth + RLS)
- Integración con pasarela de pagos (Stripe Checkout + Subscriptions + Webhooks)
- API pública REST con rate limiting (validación remota de licencias)
- Entrega segura de archivos (Storage privado + URLs firmadas)
- Plataforma de cursos embebida

### 2. Template reutilizable
Más allá del TFG, DigiStore está diseñado como **base reutilizable** para cualquier persona que quiera montar su propia tienda de productos digitales. El código es suficientemente genérico para adaptarse a distintos tipos de contenido simplemente cambiando el nombre, los colores y subiendo productos.

---

## Casos de uso reales previstos

### Jess Trading (Joaquín)
Web personal de Joaquín para vender y distribuir:
- **Algoritmos de trading** (archivos `.ex4`/`.ex5` para MetaTrader, `.py` para Python)
  - Control de licencias crítico: el algoritmo verifica via API antes de ejecutarse
  - Limitar a 1–3 máquinas por licencia
  - Plans: prueba gratuita (trial 7 días), mensual, perpetual
- **Cursos de trading** (videos en YouTube [unlisted] + PDFs + texto)
  - Acceso protegido por licencia activa
  - Viewer embebido con progreso por lección

### Tienda de arquitectura (hermano de Joaquín)
Web para vender y distribuir:
- **PDFs y plantillas** de arquitectura (planos, documentación técnica)
- **Tutoriales en video** (YouTube unlisted embebidos)
- Sin necesidad de control de licencias por máquina — solo descarga con licencia activa

---

## Qué NO es DigiStore

- **No es un marketplace**: no hay múltiples vendedores. Un solo admin controla todo.
- **No hostea videos**: los videos son URLs de YouTube (unlisted) o Vimeo embebidas. DigiStore solo guarda la URL.
- **No es SaaS multi-tenant**: es una instalación por tienda. Para otra tienda, se clona el repo y se configura un proyecto Supabase + Stripe nuevo.
- **No tiene sistema de afiliados** (no está implementado).

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Base de datos + Auth + Storage | Supabase (PostgreSQL) |
| Pagos | Stripe (Checkout Sessions + Subscriptions + Webhooks) |
| Validación | Zod + react-hook-form |
| Deploy | Vercel (serverless — sin servidor propio) |

Todo es serverless: no hay servidor Node.js persistente, no hay contenedores, no hay cron jobs propios (Supabase Edge Functions si se necesitan). El coste para volúmenes bajos/medios es prácticamente $0 (Supabase free tier + Vercel free tier + Stripe solo cobra por transacción).

---

## Modelos de acceso soportados

| Tipo | Descripción |
|------|-------------|
| **Pago único (perpetual)** | El usuario paga una vez, accede para siempre |
| **Suscripción** | Stripe cobra mensual/anual. Si cancela, la licencia expira |
| **Trial gratuito** | X días de acceso sin Stripe. Ideal para demos de software |

---

## Tipos de productos soportados

| Tipo | Entrega |
|------|---------|
| Software (`.py`, `.ex4`, `.ex5`, `.exe`, `.dmg`, `.zip`) | Descarga + verificación de licencia por API |
| Ebook (`.pdf`, `.epub`, `.mobi`) | Descarga directa tras compra |
| Curso | Viewer embebido con secciones, lecciones (video/pdf/texto/archivo) y progreso |
| Template / Plantilla | Descarga de ZIP o archivos individuales |

---

## Funcionalidades implementadas

ver todo.md

---

## Estructura de despliegue

```
GitHub repo
    └── Vercel (auto-deploy en push a main)
            ├── Next.js App (serverless functions)
            ├── Supabase (DB + Auth + Storage)  ← separado, hosted
            └── Stripe  ← pasarela de pagos externa
```

Variables de entorno necesarias en Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL` (el dominio de producción)

---

## Para reutilizar DigiStore en otra tienda

1. Fork/clone del repositorio
2. Nuevo proyecto en Supabase → ejecutar `supabase/migration.sql`
3. Nuevo proyecto en Stripe → crear precios y configurar webhook
4. Cambiar nombre "DigiStore" por el nombre de la tienda (buscar y reemplazar)
5. Ajustar paleta de colores en `tailwind.config.ts` / CSS variables
6. Deploy en Vercel con las variables de entorno correspondientes
7. Hacer admin al primer usuario:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@tienda.com';
   ```
