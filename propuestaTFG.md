# Proposta de TFG — Informació general

---

**Títol:** DigiStore: Plataforma de gestió i distribució de productes digitals

**Grau:** Grau d'Enginyeria Informàtica

**Conformitat de la càrrega de treball en ECTS:** Sí. El treball es correspon amb la càrrega de 12 ECTS establerta per al Treball de Fi de Grau del Grau d'Enginyeria Informàtica.

**Tutor:** Manresa Yee, Cristina Suemay

**Cotutor (opcional):** —

**Supervisor (opcional):**
- Nom i cognoms: —
- Correu electrònic: —
- Entitat: —

---

**Descripció:**

DigiStore és una aplicació web de pila completa per a la venda i distribució de productes digitals. La plataforma permet als administradors publicar productes de quatre tipologies —programari, cursos, ebooks i plantilles— i als compradors adquirir-los i accedir-hi des d'un tauler personal.

El repte tècnic principal és oferir un mecanisme d'entrega adaptat a cada tipus de producte: una API pública per a la verificació i activació de llicències per a programari, descàrrega segura amb URLs firmades per a ebooks i plantilles, i un visualitzador integrat amb reproducció de vídeo i seguiment de progrés per a cursos. El control d'accés es gestiona mitjançant un sistema de llicències integrat amb la passarel·la de pagament Stripe, amb suport per a pagaments únics, subscripcions recurrents i períodes de prova gratuïts.

---

**Objectius:**

1. Dissenyar i implementar la plataforma de distribució amb mecanismes d'entrega adaptats a cada tipus de producte.
2. Integrar Stripe per gestionar pagament únic, subscripció mensual/anual i trial gratuït, inclòs el cicle de vida complet de les subscripcions.
3. Desenvolupar una API pública (v1) per a la verificació, activació i desactivació remota de llicències de programari, amb limitació de taxa per prevenir abusos.
4. Construir el panell d'administració per gestionar productes, llicències, ordres, cupons i ressenyes.
5. Garantir la seguretat de l'aplicació mitjançant polítiques RLS, prevenció d'IDOR i distribució de fitxers amb URLs firmades de durada limitada.
6. Implementar autenticació amb correu/contrasenya i OAuth (Google), recuperació de contrasenya i control d'accés basat en rols.
7. Desenvolupar un sistema de notificacions per correu electrònic transaccional per als principals esdeveniments del cicle de vida d'un accés.

---

**Bibliografia:**

- Vercel Inc. (2025). *Next.js Documentation*. https://nextjs.org/docs
- Supabase Inc. (2025). *Supabase Documentation*. https://supabase.com/docs
- Stripe Inc. (2025). *Stripe API Reference*. https://stripe.com/docs/api
- PostgreSQL Global Development Group. (2025). *PostgreSQL 16 Documentation*. https://www.postgresql.org/docs/16/
- Resend Inc. (2025). *Resend Documentation*. https://resend.com/docs

---

**Recomanacions (opcional):**

Es recomana que l'estudiant hagi cursat les assignatures de Bases de Dades I i II i l'assignatura Aplicacions Distribuïdes a Internet i Interfícies d'Usuari.

---

# Recursos a disposició de l'estudiant

**Recursos materials:**

- Ordinador personal amb connexió a Internet

**Disponibilitat del tutor per a tutories (en hores setmanals o mensuals):**

2 hores mensuals, a concretar amb l'estudiant.
