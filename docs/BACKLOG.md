# BACKLOG.md — Sprints

> **Sprint activo:** `Sprint 10 — Analítica + Dashboard interno`
> **Estado:** No iniciado (Sprint 0–4, 6–9 completados el 2026-05-02; Sprint 5 diferido)
> **Última actualización:** 2026-05-02

Ordenados por dependencias. **Empieza siempre por el sprint marcado como "activo" arriba.** Cuando termines un sprint, marca su checkbox y actualiza el header.

---

## Sprint 0 — Setup del proyecto

**Objetivo:** Tener el repo arrancando en local con Postgres, Prisma migrado, seed cargado y Next.js levantando en `localhost:3000`.

- [x] Verificar que `donot-material/` tiene los assets esperados (ver `CLAUDE.md` § "Assets de marca"). Si faltan, detener y avisar al usuario.
- [x] Copiar assets de `donot-material/brand/` a `public/brand/` con nombres en kebab-case:
  - `do-not-verde-fondo-crema.png` (logo principal)
  - `do-not-crema-fondo-verde.png` (logo para fondos oscuros)
  - `mascota-crema-verde.png` (mascota canónica)
  - `mascota-azul-naranjo.png` (mascota variante)
- [x] Copiar assets de `donot-material/menu/` a `public/menu/` con los slugs documentados en `PRODUCT_CATALOG.md`:
  - `21.png` → `cookies-and-cream.png`
  - `22.png` → `creme-brulee.png`
  - `23.png` → `pie-de-limon.png`
  - `24.png` → `glaseada.png`
  - `25.png` → `crocanti.png`
  - `26.png` → `pie-de-manzana.png`
  - `27.png` → `tiramisu.png`
  - `28.png` → `alfajor.png`
- [x] `npm install`
- [x] `cp .env.example .env` y completar valores de desarrollo
- [x] `docker compose up -d` (Postgres en `localhost:5433` — cambiado de 5432 porque polla2026 lo ocupa)
- [x] `npx prisma migrate dev --name init`
- [x] `npx prisma db seed` — verifica que `Droop 001` con sus 8 sabores y las 4 cajas quedaron en BD
- [x] `npm run dev` — Next.js arranca sin errores en `http://localhost:3000`
- [ ] `npx prisma studio` — verifica visualmente que el seed cargó (opcional — counts ya verificados por SQL)

**Definition of done:** página por defecto de Next.js carga, BD tiene Droop 001 + 8 sabores + 4 cajas + 6 zonas de cobertura.

---

## Sprint 1 — Tipografías, Tailwind y layout base

**Objetivo:** Sistema visual implementado. Tipografías cargadas. Layout con header y footer aplicando paleta y mascota. Página home placeholder con la marca visible.

- [x] Instalar fuentes vía `next/font/google` en `app/layout.tsx`: Sniglet (peso 800) + Inter
- [x] Verificar que `tailwind.config.ts` ya tiene la paleta `donot.*` (viene en el scaffold)
- [x] Crear `<Header>` con logo verde sobre crema + nav simple + botón carrito (sin lógica todavía)
- [x] Crear `<Footer>` con fondo verde, logo crema, mascota Azul/Naranjo en esquina
- [x] Página `/` con hero centrado: logo grande, tagline corta, CTA "Ver el drop"
- [x] Página `/sobre-nosotros` (placeholder con copy genérico — Fernanda enviará después)
- [x] Página `/contacto` con formulario simple (nombre, email, mensaje) — sin backend aún
- [x] Componente `<MascotaEmpty>` para empty states (lo usaremos en sprints siguientes)

**Definition of done:** la home se ve "como donot." al cargarse en mobile y desktop. Cualquier persona del equipo de Fernanda reconoce la marca.

---

## Sprint 2 — Catálogo público y configurador

**Objetivo:** Página de Droop activo + página de caja con configurador de 2 pasos según mockup.

> **Lee `docs/MOCKUP_REFERENCE.md` antes de empezar.** Y abre el mockup en `https://app.optify.cl/presentaciones/prueba.html`.

- [x] Endpoint `GET /api/droops/active` que retorna el Droop vigente con sus sabores
- [x] Endpoint `GET /api/boxes` con catálogo de cajas activas
- [x] Endpoint `GET /api/boxes/[slug]` con detalle + sabores compatibles
- [x] Página `/droop/[slug]` con cover del drop, tagline, grid de sabores con sus fotos y descripciones oficiales
- [x] Componente `<BoxCard>` (paso 1 del configurador)
- [x] Página home `/`: hero + las 4 cards de cajas (las 2 azucaradas con overlay "Próximamente")
- [x] Página `/caja/[slug]`: configurador de 2 pasos
  - Paso 1: confirmación de la caja seleccionada
  - Paso 2: grid de sabores compatibles con control +/-
  - Contador `X/N` sticky
  - Botón "Quiero estas donas" deshabilitado hasta `X = N`
- [x] Persistencia del progreso en `localStorage` (clave: `donot:cart` + `donot:in-progress:${slug}`)
- [x] Mobile-first: probar en viewport 375px (sticky CTA + grid 2 cols)

**Definition of done:** Fernanda puede entrar al sitio, elegir una Cajita 6 Premium, configurarla con 6 sabores y "agregar al carrito" (que por ahora solo guarda en localStorage).

---

## Sprint 3 — Carrito y checkout (sin pagos aún)

**Objetivo:** Carrito funcional, checkout con datos de despacho, validación de cobertura y cupón. Sin pasarelas todavía — solo el formulario y la lógica de cálculo.

- [x] Página `/carrito`: muestra cajas configuradas, permite editar cantidades, sumar otra caja, aplicar cupón, ver totales
- [x] Componente `<CouponInput>` con validación contra `POST /api/coupons/validate`
- [x] Endpoint `POST /api/coupons/validate` — valida vigencia, max_uses, min_order, retorna descuento aplicable
- [x] Endpoint `GET /api/coverage` — lista comunas activas con tarifas
- [x] Página `/checkout` con secciones acordeón:
  - Contacto (email, nombre, teléfono)
  - Despacho (radio retiro/despacho + form de comuna y dirección)
  - Fecha y franja
  - Cupón (reutiliza componente)
  - Resumen
  - Método de pago (selector de pasarela — sin integración todavía, solo UI)
- [x] Validación con Zod en cliente y servidor
- [x] Endpoint `POST /api/cart/validate` — valida un carrito completo antes de cobrar
- [x] Cálculo de totales: subtotal + descuento + envío (si aplica) + total
- [x] Banner de cross-selling: "Te falta solo X cajas más para envío gratis"

**Definition of done:** se puede llegar hasta el botón final de "Pagar con [pasarela]" sin que se rompa nada. La Order todavía no se crea — eso viene en el siguiente sprint.

---

## Sprint 4 — Mercado Pago end-to-end

**Objetivo:** Flujo completo de compra funcionando con Mercado Pago en sandbox. Email de confirmación enviado.

> **Lee `docs/PAYMENT_INTEGRATIONS.md` § Mercado Pago antes de empezar.**

- [x] Crear adapters en `lib/payments/`: `types.ts` con interface `PaymentProvider`, `mercadopago.ts` implementación, `index.ts` factory
- [x] Endpoint `POST /api/checkout`:
  - Valida carrito completo con Zod
  - Crea `Order(status=PENDING)` y `OrderItem`s en transacción
  - Llama al adapter MP para crear preference
  - Retorna `init_point` al frontend
- [x] Frontend en `/checkout` redirige a `init_point` después de confirmar
- [x] Endpoint `POST /api/webhook/mercadopago`:
  - Valida firma HMAC con `MP_WEBHOOK_SECRET`
  - Insert en `WebhookLog` (idempotencia)
  - Si `payment.status === "approved"`: `Order.status = PAID`, decrementa stock, dispara email
- [x] Cliente Resend configurado en `lib/email/` (con stub a consola si falta API key)
- [x] Plantilla HTML "confirmación de pago" con mascota en header y tono de marca
- [x] Página `/checkout/exito` con número de pedido, link a tracking público y mascota
- [x] Página `/checkout/error` con CTA "Reintenta en un toque"
- [x] Página `/pedido/[token]` que muestra estado actual del pedido (público, sin auth)
- [x] Bonus: `POST /api/orders/[token]/refresh` que consulta MP directamente — fallback para localhost donde el webhook no puede llegar

**Definition of done:** se completa una compra real de punta a punta en sandbox de MP. Email de confirmación llega. Tracking público muestra el pedido como PAID.

---

## Sprint 5 — Webpay + Khipu (DIFERIDO)

> **Decisión 2026-05-02:** se posterga. MVP arranca solo con Mercado Pago.
> Cuando se reactive: el `lib/payments/index.ts` ya tiene factory por nombre,
> los adapters nuevos solo deben implementar la interface `PaymentProvider` y
> el selector de pasarela en checkout vuelve a habilitarlos.

**Objetivo:** Las otras dos pasarelas operativas con la misma calidad que MP.

> **Lee `docs/PAYMENT_INTEGRATIONS.md` § Transbank y § Khipu antes de empezar.**

- [ ] Adapter `lib/payments/transbank.ts` (commit síncrono)
- [ ] Endpoint `POST /api/webhook/transbank/return` (no es webhook real, es returnUrl con commit)
- [ ] Adapter `lib/payments/khipu.ts` (HTTP directo, sin SDK)
- [ ] Endpoint `POST /api/webhook/khipu` con validación de notification_token
- [ ] Selector de pasarela en `/checkout` ya operativo para las 3
- [ ] Tests manuales en sandbox de las 3 pasarelas

**Definition of done:** las 3 pasarelas funcionan. El cliente puede elegir cualquiera.

---

## Sprint 6 — Auth admin + módulo Pedidos

**Objetivo:** Login admin funcional, CRUD básico de pedidos, vista lista y detalle.

- [x] Tabla `AdminUser` con seed inicial (1 OWNER con email `andres@morgansmedia.cl`, password configurada por env var inicial)
- [x] Endpoint `POST /api/admin/login` con bcrypt + JWT firmado
- [x] Cookie HttpOnly + Secure + SameSite=Lax
- [x] Middleware en `app/(admin)/admin/...` que valida sesión y rol (vía `requireAdmin()` en layout `(authed)`)
- [x] Página `/admin/login`
- [x] Página `/admin` (dashboard con KPIs básicos del día)
- [x] Página `/admin/pedidos` con listado filtrable (estado, fecha, comuna)
- [x] Página `/admin/pedidos/[id]` con detalle completo
- [x] Acción "Cambiar estado" en detalle: dispara email correspondiente

**Definition of done:** Andrés y Fernanda pueden loguearse y ver pedidos reales (de los hechos en sprint 4-5).

---

## Sprint 7 — Pantalla Cocina + estados automáticos

**Objetivo:** Luigi tiene una vista mobile-first donde gestiona pedidos del día con 3 botones grandes. Cada cambio de estado dispara email automático.

- [x] Página `/admin/cocina` mobile-first:
  - Cards grandes apiladas verticalmente
  - Cada card: número de pedido, sabores con cantidades, franja, modalidad
  - 3 botones grandes: "Empezar a preparar", "Listo para despacho", "Entregado"
  - Filtros: hoy / mañana / esta semana, por modalidad
- [x] Plantillas HTML de email para cada transición (creadas en Sprint 6):
  - PAID → PREPARING ("Tus donitas se están preparando")
  - PREPARING → IN_TRANSIT ("Tus donitas van en camino")
  - IN_TRANSIT → DELIVERED ("Llegaron tus donitas — cuéntanos qué tal")
- [x] Cada plantilla con mascota en header y tono de marca

**Definition of done:** Luigi puede operar el día completo desde un teléfono sin entrar al admin general.

---

## Sprint 8 — Catálogo administrable (Droops, Cajas, Sabores)

**Objetivo:** Fernanda puede crear Droops, sabores y cajas sin ayuda técnica.

- [x] Página `/admin/droops` — lista + crear/editar Droop
- [x] Página `/admin/sabores` — CRUD de sabores con uploader de imagen, asignación a Droop, stock manual o reposición diaria
- [x] Página `/admin/cajas` — CRUD de cajas con uploader de imagen y calendario de disponibilidad
- [x] Uploader de imágenes (local a `public/uploads/`; Cloudinary queda como swap futuro reemplazando `app/api/admin/upload/route.ts`)
- [x] Vista `/admin/calendario` mensual con qué cajas/sabores están disponibles cada día + contador de pedidos

**Definition of done:** Fernanda crea Droop 002 con 3 sabores nuevos y los publica sin tocar código.

---

## Sprint 9 — Cupones, cobertura, configuración

**Objetivo:** Auto-administración completa.

- [x] Página `/admin/cupones` con CRUD y métricas (usos, ingresos generados, descuento total)
- [x] Página `/admin/cobertura` con CRUD de zonas + thresholds de envío gratis por comuna
- [x] Página `/admin/usuarios` (solo OWNER) con creación + roles + reset de password (invitación por email queda como mejora futura)
- [x] Página `/admin/config` con: datos de contacto, umbrales de envío, prefijo de pedidos, puntos de retiro. Las claves sensibles (MP, Resend, GA4, Pixel, CAPI, Cloudinary, JWT) viven en .env por seguridad — la página lo explica explícitamente

**Definition of done:** todo lo configurable está en el admin, nada en código.

---

## Sprint 10 — Analítica + Dashboard interno

**Objetivo:** GTM, GA4, Meta Pixel, CAPI conectados y funcionando. Dashboard interno con KPIs.

- [ ] Setup GTM (1 contenedor)
- [ ] Eventos del dataLayer disparándose: view_item, select_item, add_to_cart, view_cart, begin_checkout, add_payment_info, purchase, coupon_applied, droop_view
- [ ] Conversions API server-side desde el webhook de pago confirmado
- [ ] Dashboard `/admin` ya existente, ahora con datos reales:
  - Pedidos del día/semana/mes
  - Ingresos brutos y netos
  - Ticket promedio
  - Embudo
  - Top sabores y top cajas
  - Performance por Droop

**Definition of done:** GA4 muestra el embudo completo. El dashboard interno cuadra con GA4 ± 5%.

---

## Sprint 11 — QA, hardening y soft launch

**Objetivo:** El equipo prueba todo en producción staging, ajusta copies, monitorea, y pasa a producción real.

- [ ] Setup VPS Hostinger KVM 2 — Ubuntu 24.04, Node 20, PostgreSQL 16, NGINX, Certbot
- [ ] Deploy con PM2 vía GitHub Actions
- [ ] DNS de `donot.cl` apuntando al VPS
- [ ] SSL via Let's Encrypt
- [ ] UptimeRobot configurado contra `/api/health`
- [ ] Backups diarios `pg_dump` a Backblaze B2
- [ ] Pruebas manuales del equipo: cada uno hace 1 pedido real y verifica el flujo completo
- [ ] Ajustes de copies y plantillas de email según feedback
- [ ] Onboarding a Fernanda y Luigi con tutorial breve

**Definition of done:** primera venta real en producción. Sistema corriendo 7 días sin downtime.

---

## Cómo trabajar con este backlog

1. Toma el sprint marcado como **activo** en el header.
2. Marca su título como `(en progreso)` en el header.
3. Avanza por los checkboxes en orden. Cada checkbox = 1 commit (al menos).
4. Cuando termines todos los checkboxes, valida la **Definition of done**.
5. Marca todos los checkboxes y mueve el header al siguiente sprint.
6. Avísale al usuario.

**Si el sprint requiere decisión de producto** (qué color usar, qué copy, qué orden), pregunta al usuario antes de inventarlo.

**Si encuentras un bloqueo técnico** (ej. una API no responde), documenta el bloqueo en `docs/BLOCKERS.md` y pasa al siguiente checkbox que no dependa de eso.
