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

---

## Pendiente

- [x] Cuando se sube un fichero, que no se modifique el nombre original del archivo
- [ ] Implementar course viewer (DB migration, curriculum builder en admin, player en dashboard)
- [x] Que el acceso a /dashboard esté disponible también desde el header (usuarios logueados)
- [ ] Diseñar sistema para limitar cuántas licencias puede tener un usuario por plan (máx 1 por plan)
- [ ] Opción para cambiar contraseña desde /dashboard/profile (usuario logueado)
- [ ] Admin: poder cambiar el estado de una licencia directamente desde la vista de licencia
