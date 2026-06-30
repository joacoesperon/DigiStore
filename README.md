# DigiStore

Plataforma web completa para la **venta de productos digitales por parte de un único vendedor**, con gestión de licencias, pasarela de pagos y entrega segura de contenido integradas en un sistema propio. No es un *marketplace*: un administrador gestiona todo el catálogo y los compradores acceden a su panel para descargar productos y administrar sus licencias.

Da soporte a **cuatro tipos de producto** (software, libro electrónico, plantilla y curso), cada uno con su propio comportamiento tras la compra: claves de licencia verificables por API para el software, entrega de archivos mediante enlaces firmados para libros y plantillas, y un visor integrado con seguimiento de progreso para los cursos.

## Características

- **Catálogo** con cuatro tipos de producto, cada uno con su entrega adaptada.
- **Pagos** con Stripe: pago único, suscripciones (mensual/anual) y períodos de prueba gratuitos.
- **Ciclo de vida de licencias** completo (emisión, activación por dispositivo, suspensión por impago, recuperación, cancelación, expiración y revocación) con histórico auditable.
- **API REST pública** para verificar, activar y desactivar licencias desde software de terceros, con limitación de tasa.
- **Entrega segura de archivos** mediante URLs firmadas de duración limitada sobre un *bucket* privado.
- **Visor de cursos** con vídeo embebido (YouTube/Vimeo), contenido en Markdown, archivos adjuntos y progreso por lección.
- **Correos transaccionales** (confirmación de compra, fallo y recuperación de pago, cancelación, aviso de expiración de prueba).
- **Panel de administración** para productos, planes, licencias, órdenes, cupones, reseñas y clientes.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, React Server Components) · TypeScript |
| Interfaz | Tailwind CSS v4 · shadcn/ui |
| Base de datos · Auth · Almacenamiento · Funciones | Supabase (PostgreSQL) |
| Pagos | Stripe (Checkout, Subscriptions, Webhooks) |
| Correo transaccional | Resend (React Email) |
| Validación | Zod · react-hook-form |
| Despliegue | Vercel (serverless) |

## Estructura del proyecto

```
app/            Rutas y páginas (App Router): catálogo, panel de usuario, admin y rutas de API
components/     Componentes de interfaz (incluye los de shadcn/ui)
lib/            Lógica de negocio: clientes de Supabase, Stripe, emails, utilidades
types/          Tipos TypeScript de la base de datos
supabase/       migration.sql (esquema completo) y functions/ (Edge Function programada)
scripts/        load-test.mjs (prueba de carga de la API de licencias)
proxy.ts        Protección de rutas (middleware de Next.js)
```

## Requisitos previos

- Node.js 20 o superior
- Una cuenta en [Supabase](https://supabase.com), [Stripe](https://stripe.com) y [Resend](https://resend.com)

## Puesta en marcha

1. **Clonar e instalar dependencias**
   ```bash
   git clone <URL-del-repositorio>
   cd digistore
   npm install
   ```

2. **Configurar las variables de entorno**: copiar `.env.example` a `.env.local` y rellenar los valores (ver la tabla de abajo).
   ```bash
   cp .env.example .env.local
   ```

3. **Base de datos**: crear un proyecto en Supabase y ejecutar el contenido de `supabase/migration.sql` en el *SQL Editor*. Crear después un *bucket* de almacenamiento llamado `product-files` (privado) en *Storage*.

4. **Pagos**: en el panel de Stripe, configurar un *endpoint* de *webhook* que apunte a `/api/webhooks/stripe` y copiar su secreto de firma a `STRIPE_WEBHOOK_SECRET`.

5. **Arrancar en desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación queda disponible en `http://localhost:3000`.

6. **Conceder rol de administrador** al primer usuario registrado, desde el *SQL Editor* de Supabase:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'tu-correo@ejemplo.com';
   ```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de rol de servicio (solo servidor) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave publicable de Stripe |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma de los *webhooks* de Stripe |
| `NEXT_PUBLIC_SITE_URL` | URL pública de la aplicación |
| `LICENSE_KEY_SECRET` | Secreto para la generación de claves de licencia |
| `RESEND_API_KEY` | Clave de API de Resend |
| `RESEND_FROM_EMAIL` | Dirección remitente de los correos |
| `INTERNAL_SECRET` | Secreto compartido con la Edge Function programada |

## Modelos de venta

| Tipo | Funcionamiento |
|------|----------------|
| Pago único (*perpetual*) | El usuario paga una vez y conserva el acceso de forma permanente |
| Suscripción | Stripe cobra de forma recurrente (mensual o anual); la licencia se suspende ante un impago y se reactiva al recuperarse |
| Prueba (*trial*) | Acceso gratuito durante un número de días configurable; expira automáticamente |

## API pública de licencias

Pensada para que un software de terceros valide su licencia de forma remota. Tres *endpoints* REST, sin sesión de usuario y con limitación de tasa:

| Método | Ruta | Límite |
|--------|------|--------|
| `POST` | `/api/v1/licenses/verify` | 60 peticiones/min |
| `POST` | `/api/v1/licenses/activate` | 30 peticiones/min |
| `POST` | `/api/v1/licenses/deactivate` | 30 peticiones/min |

## Modelo de datos

El esquema comprende **13 tablas** organizadas en cuatro dominios (catálogo, licencias, órdenes y cursos) más tablas transversales (perfiles, cupones y reseñas). La definición completa —tablas, índices, políticas de *Row Level Security*, *triggers* y funciones— está en [`supabase/migration.sql`](supabase/migration.sql).

## Despliegue

El proyecto está pensado para desplegarse en **Vercel**: al importar el repositorio, cada *push* a la rama principal lanza un despliegue automático. Hay que definir en Vercel las mismas variables de entorno listadas arriba. La base de datos, la autenticación y el almacenamiento los provee Supabase, y los pagos, Stripe.

## Scripts

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Análisis estático con ESLint |
| `node scripts/load-test.mjs` | Prueba de carga sobre la API de verificación de licencias |

## Reutilización

La plataforma está concebida como una base reutilizable para distintos negocios de venta de productos digitales. Para adaptarla a otra tienda basta con un nuevo proyecto de Supabase y de Stripe, ajustar la marca y los colores y subir los productos.
