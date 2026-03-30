## Completado

- [x] Infraestructura base (Supabase, Stripe, auth, tipos)
- [x] Auth email/password + Google OAuth
- [x] CRUD de productos desde admin
- [x] Gestión de planes de licencia por producto
- [x] Catálogo público + página de detalle
- [x] Checkout (pago único, suscripción, trial gratuito sin Stripe)
- [x] Webhook Stripe → generación de licencia
- [x] Dashboard de usuario (licencias, órdenes, perfil)
- [x] API pública v1 (verify, activate, deactivate) con rate limiting
- [x] Admin panel completo (licencias, órdenes, cupones, reseñas, clientes)
- [x] Revocar / suspender licencias con motivo (admin)
- [x] Upload de archivos descargables desde admin (drag & drop, 200 MB)
- [x] Entrega segura de archivos (URL firmada, solo con licencia activa)
- [x] Páginas legales (Terms of Service, Privacy Policy)
- [x] Google OAuth
- [x] Fix admin redirect (proxy.ts con fetch nativo en Edge Runtime)
- [x] Fix RLS infinite recursion (drop policy + createServiceClient en 10 páginas admin)
- [x] Fix productos no aparecían en /products (createServiceClient en páginas públicas)
- [x] Fix upload fallaba con 42P17 (API route server-side con service role key)
- [x] Texto adaptativo del botón de compra según tipo de plan
- [x] Fix licencias perpetuas gratuitas con status 'trial' en vez de 'active'
- [x] Dashboard de licencias adaptativo por tipo de producto (software / ebook / template / course)
- [x] LicenseCard adaptativa por tipo de producto
- [x] Eliminar plan con cascade (license_activations → events → licenses → order_items → plan)
- [x] Eliminar producto con cascade + confirmación (DeleteProductButton + zona de peligro)
- [x] Instalar alert-dialog de shadcn
- [x] Botón Download en FileUpload para que admin pueda descargar archivos
- [x] Flujo completo de recuperación de contraseña (forgot-password + reset-password)
- [x] Fix callback route: prioridad de 'next' sobre 'redirectTo'
- [x] Cuando se sube un fichero, que no se modifique el nombre original del archivo
- [x] Que el acceso a /dashboard esté disponible también desde el header (usuarios logueados)
- [x] Sistema de límite de 1 licencia activa por plan por usuario (checkout + webhook + UI)
- [x] Ocultar botón "Create account" en homepage si ya hay sesión iniciada
- [x] Cambiar contraseña desde /dashboard/profile (con verificación de contraseña actual, adaptativo por tipo de identidad)
- [x] Admin: gestión avanzada de licencias (ver propietario, buscar por email, activations adaptativo por tipo de producto)
- [x] Que los usuarios puedan cancelar suscripciones y mantener acceso hasta el próximo período de facturación
- [x] Implementar como puedo ver la fecha de cuando se renueva/termina los planes de suscripcion
- [x] Fix precio de plan se mostraba 100x más barato en vista admin (doble división por 100 en PlansManager)
- [x] Fix LicenseCard mostraba "Expires" para suscripciones activas en lugar de "Renews" / "Cancels"
- [x] Descartar licencias gratuitas desde el dashboard de usuario (botón Discard + filtro revoked en lista)
- [x] Sistema de trials mejorado: 1 trial por cuenta (histórico), planes de suscripción con trial nativo de Stripe (tarjeta upfront, cobro automático al terminar)
- [x] Normalizar comportamiento de trials: 1 por cuenta, no descartables, "Trial used" en store, toast de error correcto
- [x] Eliminar feature "Discard license" (no existe en la industria): removidos DiscardLicenseButton, API route, y filtro revoked del dashboard
- [x] Fix: expires_at check en ownedPlanIds query (trials expirados no bloqueaban la compra en product page)
- [x] Webhook invoice.payment_failed → licencia suspendida + banner amarillo en dashboard
- [x] Emails transaccionales (Resend + React Email): payment_failed, payment_recovered, subscription_cancelled, trial_expiring_soon
- [x] Supabase Edge Function cron (diario 09:00 UTC): aviso de trial que expira en 3 días
- [x] Ocultar licencias del dashboard: botón "Hide / Restore" en detalle, filtro hidden + "Show N hidden" en lista
- [x] Campo "Días gratis antes del primer cobro" en formulario de plan tipo suscripción
- [x] Sesión 21 — Course viewer: DB migration, curriculum builder en admin, player en dashboard con tracking de progreso
- [x] Sesión 22 — Lecciones con Markdown (react-markdown + remark-gfm + @tailwindcss/typography) y archivos adjuntos por lección (upload en admin, descarga firmada con verificación de licencia en viewer)
- [x] Sesión 23 — Email de confirmación de compra (receipt post-checkout; template PurchaseConfirmationEmail, getEmailData extendida con full_name, disparado desde handleCheckoutSessionCompleted)

---

## Pendiente

- [ ] Formulario de reseñas para usuarios — en `/products/[slug]` (tras compra) y/o en dashboard
- [ ] Admin reviews: botón Rechazar/Eliminar (actualmente solo existe Approve)
- [ ] Admin customers: página de detalle por cliente (licencias + órdenes)
- [ ] Gráficas de revenue en admin — evolución temporal de ingresos
- [ ] Filtros/búsqueda en catálogo público `/products` — por tipo, nombre

---
