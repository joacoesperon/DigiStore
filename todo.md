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

---

## Pendiente

- [ ] Implementar course viewer (DB migration, curriculum builder en admin, player en dashboard)
- [ ] Diseñar e implementar sistema de trials con tarjeta de crédito (cobro automático al terminar, conversión vs. friction, anti-abuse),ahora los trial se pueden "comprar", antes de que terminen se pueden descartar y entonces los podes vovler a comprar, esto lo podes hacer infinitas veces, la idea de los trial es que sean una vez por cuenta, y estaria bueno que incluso haya un metodo para que alguien no pueda crearse 10 cuentas diferentes y usar el trial 10 veces

---

Capa 1 — El problema actual (mismo usuario, misma cuenta)
Hoy el flujo es:

Usuario toma trial → licencia type: trial, status: trial
Descarta → status: revoked
Vuelve a "comprar" el trial → nueva licencia type: trial, status: trial
Infinitamente
El fix es simple: antes de crear un trial, el check actual busca licencias con status IN ('active', 'trial'). Habría que cambiar eso para trials: verificar si el usuario ya tuvo alguna vez (cualquier status) una licencia de ese plan con type = 'trial'. Si existe una sola en la historia → bloqueado.

Esto resuelve el abuso de misma cuenta sin tocar nada más.

Capa 2 — Múltiples cuentas (persona distinta, emails distintos)
Acá hay un espectro de soluciones con sus trade-offs:

Método	Efectividad	Fricción para el usuario legítimo
Bloqueo de emails desechables (mailinator, etc.)	Baja — trivial de evadir con Gmail alias	Ninguna
Rate limiting por IP	Baja — VPN resuelve en 30 segundos	Ninguna para usuarios normales
Verificación de teléfono	Alta — conseguir 10 SIMs es caro	Media (molesta un poco)
Tarjeta de crédito upfront	Muy alta — Stripe detecta la misma tarjeta	Ninguna extra si el trial es gratis
FingerprintJS (device ID)	Media — evadible con modo incógnito	Ninguna
La realidad: la mayoría de los SaaS simplemente no lo resuelve del todo. El porcentaje de personas que crean 10 cuentas para abusar de un trial es tan pequeño que el costo de bloquearlos (fricción para usuarios legítimos, desarrollo, mantenimiento) generalmente supera el beneficio.

La solución más efectiva sin fricción real es la tarjeta upfront, porque Stripe asocia la tarjeta a un customer — dos trials con la misma tarjeta son detectables.

Capa 3 — Trial con tarjeta (cobro automático)
Esta es la decisión más importante porque cambia el modelo de negocio:

Modelo actual: Trial = plan separado, sin Stripe, el usuario decide si compra otro plan al terminar.

Modelo Stripe nativo: Trial = entrada a una suscripción. El usuario da su tarjeta, no se le cobra durante X días, al terminar Stripe cobra automáticamente y la suscripción arranca.

Stripe soporta esto nativamente con subscription_data: { trial_period_days: X } en el Checkout Session. Al terminar el trial, dispara customer.subscription.updated y luego, si no cancela, invoice.payment_succeeded.

Datos de conversión (industria):

Sin tarjeta upfront: 1-5% de trials convierte a pago
Con tarjeta upfront: 15-40% convierte (la gente que da la tarjeta ya está comprometida, y la inercia hace que muchos no cancelen)
La pregunta clave: ¿Para qué tipos de plan tiene sentido?

Subscription + trial con tarjeta → 100% natural, Stripe lo maneja nativo
Perpetual + trial con tarjeta → raro, Stripe no tiene soporte nativo para "cobrar un único pago al terminar el trial"; habría que implementarlo manualmente (muy complejo)
Trial standalone sin cobro → lo que tenemos hoy; sigue teniendo sentido como "prueba gratuita sin compromiso"
Preguntas para definir el camino
Antes de proponer una implementación concreta necesito que definas:

¿El trial siempre va ligado a un plan de suscripción, o también querés trials para planes perpetuos? (esto cambia mucho la arquitectura)

¿Querés el modelo "tarjeta upfront + cobro automático" o preferís mantener el trial sin tarjeta pero que sea una sola vez por cuenta? (dos objetivos distintos, pueden coexistir pero son implementaciones separadas)

Para el abuso de múltiples cuentas: ¿te alcanza con bloqueo por email desechable + fix de misma cuenta, o querés algo más robusto?