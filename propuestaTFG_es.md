# Propuesta de TFG — Información general

---

**Título:** DigiStore: Plataforma de gestión y distribución de productos digitales

**Grado:** Grado de Ingeniería Informática

**Conformidad de la carga de trabajo en ECTS:** Sí. El trabajo se corresponde con la carga de 12 ECTS establecida para el Trabajo de Fin de Grado del Grado de Ingeniería Informática.

**Tutor:** Manresa Yee, Cristina Suemay

**Cotutor (opcional):** —

**Supervisor (opcional):**
- Nombre y apellidos: —
- Correo electrónico: —
- Entidad: —

---

**Descripción:**

DigiStore es una aplicación web de pila completa para la venta y distribución de productos digitales. La plataforma permite a los administradores publicar productos de cuatro tipologías —software, cursos, ebooks y plantillas— y a los compradores adquirirlos y acceder a ellos desde un panel personal.

El reto técnico principal es ofrecer un mecanismo de entrega adaptado a cada tipo de producto: una API pública para la verificación y activación de licencias de software, descarga segura mediante URLs firmadas para ebooks y plantillas, y un visualizador integrado con reproducción de vídeo y seguimiento de progreso para cursos. El control de acceso se gestiona mediante un sistema de licencias integrado con la pasarela de pago Stripe, con soporte para pagos únicos, suscripciones recurrentes y periodos de prueba gratuitos.

---

**Objetivos:**

1. Diseñar e implementar la plataforma de distribución con mecanismos de entrega adaptados a cada tipo de producto.
2. Integrar Stripe para gestionar pago único, suscripción mensual/anual y trial gratuito, incluyendo el ciclo de vida completo de las suscripciones.
3. Desarrollar una API pública (v1) para la verificación, activación y desactivación remota de licencias de software, con limitación de tasa para prevenir abusos.
4. Construir el panel de administración para gestionar productos, licencias, órdenes, cupones y reseñas.
5. Garantizar la seguridad de la aplicación mediante políticas RLS, prevención de IDOR y distribución de archivos con URLs firmadas de duración limitada.
6. Implementar autenticación con correo/contraseña y OAuth (Google), recuperación de contraseña y control de acceso basado en roles.
7. Desarrollar un sistema de notificaciones por correo electrónico transaccional para los principales eventos del ciclo de vida de un acceso.

---

**Bibliografía:**

- Vercel Inc. (2025). *Next.js Documentation*. https://nextjs.org/docs
- Supabase Inc. (2025). *Supabase Documentation*. https://supabase.com/docs
- Stripe Inc. (2025). *Stripe API Reference*. https://stripe.com/docs/api
- PostgreSQL Global Development Group. (2025). *PostgreSQL 16 Documentation*. https://www.postgresql.org/docs/16/
- Resend Inc. (2025). *Resend Documentation*. https://resend.com/docs

---

**Recomendaciones (opcional):**

Se recomienda que el estudiante haya cursado las asignaturas de Bases de Datos I y II y la asignatura Aplicacions Distribuïdes a Internet i Interfícies d'Usuari.

---

# Recursos a disposición del estudiante

**Recursos materiales:**

- Ordenador personal con conexión a Internet

**Disponibilidad del tutor para tutorías (en horas semanales o mensuales):**

2 horas mensuales, a concretar con el estudiante.
