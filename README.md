# DigiStore — Plataforma de Venta de Productos Digitales

npm run dev
# Para Stripe webhooks en local (terminal separada):
stripe listen --forward-to localhost:3000/api/webhooks/stripe

## ¿Qué es DigiStore?

DigiStore es una tienda completa para **vender y entregar productos digitales**: ebooks, cursos, software, plantillas, algoritmos de trading, y cualquier archivo descargable. Los compradores acceden a sus productos a través de un dashboard personal donde pueden descargar los archivos y ver sus licencias activas.

El reto técnico central es ofrecer un **mecanismo de entrega adaptado a cada tipo de producto** dentro de un flujo de compra unificado: para software, genera claves de licencia únicas y expone una API pública que cualquier programa externo (Python, MQL5, etc.) puede consultar para verificar la compra; para ebooks y plantillas, distribuye el archivo mediante URLs firmadas de duración limitada vinculadas a una licencia activa; para cursos, proporciona un visualizador integrado con reproducción de vídeo, contenido Markdown, archivos adjuntos y seguimiento de progreso por lección.

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

## API Pública de Licencias (`/api/v1/licenses/...`)

Permite que **software externo** verifique en tiempo real si un usuario compró el producto. Esto es lo que impide que alguien comparta o use el programa sin haberlo pagado.

### `POST /api/v1/licenses/verify`

```json
// Request
{ "license_key": "ABCDE-FGHIJ-KLMNO-PQRST", "machine_id": "fingerprint-único" }

// Response válida
{ "valid": true, "status": "active", "type": "perpetual", "expires_at": null,
  "product": { "id": "...", "name": "Mi Software" },
  "activations": { "current": 1, "max": 3 } }

// Response inválida
{ "valid": false, "status": "revoked", ... }
```

### `POST /api/v1/licenses/activate` — registra una máquina nueva
### `POST /api/v1/licenses/deactivate` — libera una máquina

Rate limiting: 60 req/min/IP en verify, 30 req/min/IP en activate y deactivate.

---

## Integración con Python

Agregá estas ~20 líneas al inicio de tu programa para que solo corra si el usuario compró la licencia:

```python
import requests
import hashlib
import platform
import uuid
import sys

DIGISTORE_URL = "https://tudominio.com"
CONFIG_FILE   = "license.key"   # el usuario guarda su key aquí

def get_machine_id():
    """Identificador único y reproducible de esta máquina."""
    raw = f"{platform.node()}-{uuid.getnode()}-{platform.system()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]

def read_license_key():
    try:
        with open(CONFIG_FILE) as f:
            return f.read().strip()
    except FileNotFoundError:
        key = input("Enter your license key: ").strip()
        with open(CONFIG_FILE, "w") as f:
            f.write(key)
        return key

def verify_license():
    key = read_license_key()
    machine_id = get_machine_id()
    try:
        r = requests.post(
            f"{DIGISTORE_URL}/api/v1/licenses/verify",
            json={"license_key": key, "machine_id": machine_id},
            timeout=5,
        )
        data = r.json()
        return data.get("valid", False)
    except requests.RequestException:
        print("Warning: Could not reach license server. Running in offline mode.")
        return True  # o False si preferís exigir conexión

# ── Verificación al arrancar ─────────────────────────────────────────────────
if not verify_license():
    print("❌  Invalid or expired license.")
    print(f"   Purchase at: {DIGISTORE_URL}")
    sys.exit(1)

print("✓  License verified. Starting...")
# Resto del programa...
```

Para **activar la máquina** (primer uso), llama también a `/api/v1/licenses/activate` con el mismo `license_key` y `machine_id`. Si el usuario ya tiene el máximo de máquinas registradas, la activación falla y el programa puede pedirle que desactive una desde el dashboard.

---

## Integración con MQL5 / MetaTrader

```mql5
#include <WinAPI/winapi.mqh>

#define DIGISTORE_URL  "https://tudominio.com"
#define LICENSE_FILE   "license.key"

string GetMachineID() {
    string info = TerminalInfoString(TERMINAL_NAME)
                + TerminalInfoString(TERMINAL_PATH)
                + (string)TerminalInfoInteger(TERMINAL_BUILD);
    // Simplificado — en producción usar hash
    return info;
}

string ReadLicenseKey() {
    int handle = FileOpen(LICENSE_FILE, FILE_READ | FILE_TXT | FILE_COMMON);
    if (handle == INVALID_HANDLE) return "";
    string key = FileReadString(handle);
    FileClose(handle);
    return key;
}

bool VerifyLicense() {
    string key = ReadLicenseKey();
    if (key == "") {
        Print("No license key found. Set your key in ", LICENSE_FILE);
        return false;
    }

    string body = "{\"license_key\":\"" + key + "\","
                + "\"machine_id\":\""  + GetMachineID() + "\"}";

    char data[];
    StringToCharArray(body, data, 0, StringLen(body));

    char result[];
    string headers;
    int res = WebRequest(
        "POST",
        DIGISTORE_URL + "/api/v1/licenses/verify",
        "Content-Type: application/json\r\n",
        5000,
        data,
        result,
        headers
    );

    if (res == -1) {
        Print("License server unreachable.");
        return false;  // o true si querés modo offline
    }

    string response = CharArrayToString(result);
    return StringFind(response, "\"valid\":true") >= 0;
}

int OnInit() {
    if (!VerifyLicense()) {
        Alert("Invalid license. Purchase at: " + DIGISTORE_URL);
        return INIT_FAILED;
    }
    Print("License OK. EA started.");
    return INIT_SUCCEEDED;
}
```

> **Nota**: Para que `WebRequest` funcione en MetaTrader, el usuario debe añadir `tudominio.com` en Herramientas → Opciones → Expert Advisors → Allowed URLs.

---

## Configuración inicial

### 1. Variables de entorno (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=          # supabase.com/dashboard → proyecto → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # anon public key
SUPABASE_SERVICE_ROLE_KEY=         # service_role (solo server-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # dashboard.stripe.com → Developers → API keys
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=             # al crear webhook endpoint en Stripe
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Base de datos

Ejecutar `supabase/migration.sql` en el **SQL Editor** de Supabase Dashboard.

Luego ejecutar por separado para el campo de archivos:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_path TEXT;
```

### 3. Storage bucket

En Supabase Dashboard → Storage → Create bucket:
- Name: `product-files`
- Public: **No** (privado — los archivos solo se acceden con URL firmadas)

### 4. Login con Google (opcional)

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Authorized redirect URI: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → habilitar con Client ID y Secret

> **Google OAuth es completamente gratuito.** Los $300 de crédito de Google Cloud son para otros servicios (VMs, bases de datos, ML). OAuth no tiene costo ni límite de uso.

### 5. Hacer admin al primer usuario

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### 6. Iniciar en desarrollo

```bash
npm run dev
# Para Stripe webhooks en local (terminal separada):
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Estructura de carpetas

```
app/
├── page.tsx                 # Home pública
├── products/[slug]          # Detalle de producto + selector de planes
├── checkout/success|cancel  # Páginas post-pago
├── auth/login|register      # Auth + Google OAuth
├── dashboard/               # Área del usuario (licencias, descargas, órdenes)
│   └── licenses/[id]        # Detalle de licencia + botón Download
├── admin/                   # Panel de admin (solo role=admin)
│   └── products/[id]/edit   # Con subida de archivo del producto
├── api/
│   ├── v1/licenses/         # verify · activate · deactivate (pública)
│   ├── downloads/[productId]# Descarga segura con URL firmada
│   ├── checkout/            # Crea sesión Stripe o trial directo
│   ├── webhooks/stripe/     # Webhook de Stripe (pagos y suscripciones)
│   └── admin/licenses/[id]/ # revoke · suspend
└── terms/ · privacy/        # Páginas legales
```

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

## Load test

```bash
# Objetivo: p95 < 100ms bajo 100 req/s en /api/v1/licenses/verify
node scripts/load-test.mjs TU-LICENSE-KEY 20 15
```

---

# DigiStore — Contexto del Proyecto

## ¿Qué es DigiStore?

DigiStore es una **plataforma de venta y entrega de productos digitales**. No es un marketplace (como Gumroad o Etsy) — es una tienda privada de un solo vendedor. Un administrador gestiona el catálogo, los compradores acceden a su cuenta para descargar los productos y ver sus licencias.

El diferencial técnico central es la **entrega adaptativa por tipo de producto**: un mismo flujo de compra y panel de usuario soporta cuatro tipos de productos, cada uno con su propio mecanismo de distribución segura. Para software, genera claves de licencia únicas y expone una API pública de verificación remota. Para ebooks y plantillas, distribuye archivos mediante URLs firmadas de duración limitada. Para cursos, proporciona un visualizador integrado con reproducción de vídeo, Markdown, archivos adjuntos y seguimiento de progreso. Las licencias son el mecanismo de control de acceso transversal a todos los tipos, no el núcleo en sí.

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
