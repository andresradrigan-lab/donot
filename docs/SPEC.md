# SPEC.md — Especificación funcional

> **Audiencia:** Claude Code y el equipo humano de revisión.
> **Versión:** 1.0 — Mayo 2026
> **Fuente de verdad:** Levantamiento técnico v2 (entregable PDF/DOCX por MorgansMedia)

Este documento es la versión accionable del levantamiento. Si encuentras una contradicción entre este SPEC y el levantamiento PDF, este SPEC gana (es más reciente y específico al desarrollo).

---

## 1. Producto en una frase

E-commerce de donas + back-office operativo, organizado en torno a **Droops** (colecciones limitadas de sabores), con tres pasarelas chilenas y notificaciones automáticas en cada cambio de estado del pedido.

---

## 2. Personas

| Rol | Quién | Qué hace |
|-----|-------|----------|
| **Comprador** | Cliente final, mayoría mobile | Configura una o más cajas, paga, espera entrega o retira |
| **Operador (Luigi)** | Equipo de cocina/despacho | Marca pedidos como "preparando", "en tránsito", "entregado" desde un tablet/móvil |
| **Owner (Fernanda)** | Dueña / decisión de catálogo | Crea Droops, sube sabores, ajusta precios, cupones, ve dashboard |
| **Viewer** | Andrés / consultoría externa | Solo lectura del dashboard |

---

## 3. Flujos críticos

### 3.1 Flujo de compra (storefront)

1. Cliente entra a `/`. Ve hero con drop activo, las 4 cajas y la mascota.
2. Hace click en una caja → `/caja/[slug]` (configurador).
3. **Paso 1:** confirma el tipo de caja (4 vs 6, premium vs azucaradas).
4. **Paso 2:** llena los slots eligiendo sabores. El botón "Quiero estas donas" se activa solo cuando contador llega exactamente al `slot_count`.
5. Va a `/carrito`. Puede editar cantidades, agregar otra caja, aplicar cupón.
6. Va a `/checkout`. Llena: contacto, modalidad de despacho (retiro Concón / retiro Reñaca / despacho domicilio), fecha y franja, cupón, método de pago.
7. Confirma pago → redirección a la pasarela elegida.
8. Pasarela redirige de vuelta a `/checkout/exito` (o `/checkout/error`).
9. En paralelo, el webhook de la pasarela actualiza el estado de la `Order` en la BD y dispara los correos automáticos.
10. Cliente recibe email de confirmación con link a `/pedido/[token]` (tracking público).

### 3.2 Flujo del operador (Luigi)

1. Login en `/admin` con rol OPERATOR.
2. Va a `/admin/cocina` (vista mobile-first).
3. Ve cards grandes apiladas con: número, sabores, franja, modalidad y 3 botones grandes:
   - "Empezar a preparar" → estado `PREPARING` → email automático "tus donitas se están preparando".
   - "Listo para despacho" → estado `IN_TRANSIT` → email "van en camino".
   - "Entregado" → estado `DELIVERED` → email "llegaron".
4. Filtros básicos: hoy / mañana / esta semana, por modalidad.
5. Cuando un sabor se agota: botón "Agotar hoy" en `/admin/sabores` que pone `is_active=false` (revierte automático al día siguiente si tiene `stock_reset_daily=true`).

### 3.3 Flujo del owner (Fernanda)

Tareas habituales:
- Crear un Droop nuevo: `/admin/droops` → "Nuevo droop" → asignar sabores existentes o crear nuevos → setear `starts_at` y `ends_at` → publicar.
- Subir un sabor flash: `/admin/sabores` → nuevo → asignar a Droop activo → activar.
- Crear un cupón: `/admin/cupones` → tipo, valor, vigencia.
- Ver dashboard: `/admin` → KPIs, top productos, performance por Droop.

---

## 4. Reglas de negocio

### 4.1 Configurador

- El usuario debe llenar **todos los slots** de la caja para avanzar.
- Sabores filtrados por: `Box.category` ∩ Droops activos en este momento (`starts_at <= now <= ends_at`).
- Se permite repetir sabores en la misma caja.
- Si un sabor tiene `stock = 0` o `is_active = false`, no aparece como opción.
- Si un sabor está limitado por `available_weekdays` y el día actual no está incluido, tampoco aparece.

### 4.2 Despacho

- Tres modalidades: retiro Concón ($0), retiro Reñaca ($0), despacho a domicilio (tarifa por comuna).
- Despacho solo a comunas en `CoverageZone` con `is_active = true`.
- Si el `subtotal` o `box_count` supera el umbral de envío gratis (configurable global o por comuna), `shipping_clp = 0`.

### 4.3 Pago

- Tres pasarelas, selector en checkout: Mercado Pago, Webpay, Khipu.
- Tarjeta de crédito: **una sola cuota**, sin cuotas sin interés del comercio.
- `Order` se crea con `status=PENDING`, `payment_status=PENDING` antes de redirigir a pasarela.
- Webhook actualiza estado. Si el webhook llega antes que el redirect del usuario, el `/checkout/exito` debe consultar el estado actual al cargar.
- Idempotencia: cada `payment_id` se procesa una sola vez (validar contra `WebhookLog`).

### 4.4 Estados de pedido

```
PENDING → PAID → PREPARING → IN_TRANSIT → DELIVERED
                   ↓             ↓
                CANCELLED     CANCELLED
                              REFUNDED
```

Cada transición dispara automáticamente el correo correspondiente.

### 4.5 Cupones

- Tres tipos: `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`.
- Validación: vigencia activa, `max_uses` no alcanzado, `min_order_clp` cumplido.
- Se aplica antes del cálculo de envío.
- Un pedido puede tener máximo un cupón.

### 4.6 Inventario

- `Sabor.stock` se decrementa al confirmar pago (no al agregar al carrito).
- Si `stock_reset_daily = true`, un cron diario a las 00:00 CLT pone `stock = daily_capacity`.
- Si el stock no alcanza al confirmar pago, el pedido se marca `CANCELLED` y se notifica al cliente para reembolso/cambio.

---

## 5. Endpoints de API

Todos bajo `/api/`. Validación con Zod en cada handler.

### Storefront

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/droops/active` | Droops vigentes con sus sabores |
| GET | `/api/boxes` | Catálogo de cajas activas |
| GET | `/api/boxes/[slug]` | Detalle de una caja con sabores compatibles |
| POST | `/api/cart/validate` | Valida un carrito antes de checkout |
| GET | `/api/coverage` | Lista de comunas con cobertura y tarifa |
| POST | `/api/coupons/validate` | Valida un cupón contra un carrito |
| POST | `/api/checkout` | Crea Order + transacción en pasarela elegida |
| GET | `/api/orders/[token]` | Tracking público por token |

### Webhooks (públicos, sin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/webhook/mercadopago` | Notificaciones de Mercado Pago |
| POST | `/api/webhook/transbank/return` | Return URL de Webpay (commit síncrono) |
| POST | `/api/webhook/khipu` | Notificación de Khipu |

### Admin (auth requerida con rol)

| Método | Ruta | Rol mínimo |
|--------|------|------------|
| `*` | `/api/admin/orders/*` | OPERATOR |
| `*` | `/api/admin/boxes/*` | OWNER |
| `*` | `/api/admin/flavors/*` | OWNER |
| `*` | `/api/admin/droops/*` | OWNER |
| `*` | `/api/admin/coupons/*` | OWNER |
| `*` | `/api/admin/coverage/*` | OWNER |
| `*` | `/api/admin/users/*` | OWNER |
| `*` | `/api/admin/dashboard/*` | VIEWER |

---

## 6. Páginas (App Router)

```
app/
├── (store)/
│   ├── page.tsx                    → /
│   ├── droop/[slug]/page.tsx       → /droop/[slug]
│   ├── caja/[slug]/page.tsx        → /caja/[slug]
│   ├── carrito/page.tsx            → /carrito
│   ├── checkout/page.tsx           → /checkout
│   ├── checkout/exito/page.tsx     → /checkout/exito
│   ├── checkout/error/page.tsx     → /checkout/error
│   ├── pedido/[token]/page.tsx     → /pedido/[token]
│   ├── sobre-nosotros/page.tsx     → /sobre-nosotros
│   └── contacto/page.tsx           → /contacto
├── (admin)/
│   └── admin/
│       ├── login/page.tsx          → /admin/login
│       ├── page.tsx                → /admin (dashboard)
│       ├── pedidos/page.tsx
│       ├── pedidos/[id]/page.tsx
│       ├── cocina/page.tsx
│       ├── droops/page.tsx
│       ├── droops/[id]/page.tsx
│       ├── cajas/page.tsx
│       ├── sabores/page.tsx
│       ├── calendario/page.tsx
│       ├── cupones/page.tsx
│       ├── cobertura/page.tsx
│       ├── usuarios/page.tsx
│       └── config/page.tsx
└── api/
    └── ... (ver sección 5)
```

---

## 7. Notificaciones automáticas

Cliente:

| Trigger | Tipo | Asunto |
|---------|------|--------|
| `Order.PAID` | Confirmación | Listo. Tus donitas están reservadas |
| `Order.PREPARING` | En preparación | Tus donitas se están preparando |
| `Order.IN_TRANSIT` | En tránsito | Tus donitas van en camino |
| `Order.DELIVERED` | Entregado | Llegaron tus donitas — cuéntanos qué tal |
| `Order.CANCELLED` | Cancelación | Sobre tu pedido en donot |
| Pago rechazado | Reintentar | No alcanzó el pago — reintenta |

Equipo interno:

- Nuevo pedido pagado → email a operación (Luigi).
- Stock crítico → email diario a OWNER.
- Pago fallido o webhook caído > 5 min → alerta al equipo técnico.

Tone de los emails: ver `DESIGN_SYSTEM.md` § "Tono de copy". El cuerpo HTML usa la mascota en el header.

---

## 8. Analítica

GTM como contenedor único. Eventos disparados:

- `view_item` (caja vista), `select_item` (sabor elegido)
- `add_to_cart`, `view_cart`
- `begin_checkout`, `add_payment_info`
- `purchase` (con `transaction_id`, `value`, `items`)
- `coupon_applied` (custom)
- `droop_view` (custom — clave para medir interés por colección)

Conversions API de Meta: server-side desde el webhook de pago confirmado.

---

## 9. Restricciones técnicas no negociables

- **PCI scope = SAQ-A.** Nunca recibimos datos de tarjeta. Flujo 100% redirigido.
- **HTTPS obligatorio** en producción. HSTS habilitado. TLS 1.2+.
- **Cookies de sesión:** HttpOnly + Secure + SameSite=Lax.
- **Validación de firma** en todos los webhooks de pasarelas (cuando la pasarela lo soporta).
- **Rate limiting** en `/api/checkout`, `/api/coupons/validate`, `/api/admin/login`.
- **Hash bcrypt** (cost 12) para passwords admin.
- **Logs sin PII.** Email/teléfono enmascarados (`f***@***.com`).
- **Backups:** `pg_dump` diario, retención 30 días.

---

## 10. Lo que NO está en el MVP

Para evitar scope creep:

- App nativa iOS/Android.
- Tracking GPS en vivo del repartidor (Fase 2).
- Cuentas de cliente con login (Fase 2 — en MVP es compra como invitado).
- Programa de puntos / loyalty (Fase 2).
- Cálculo de envío por distancia geográfica (en MVP es lista plana de comunas).
- Suscripciones recurrentes (Fase 3).
- Boleta electrónica vía SII (Fase 3 — en MVP es registro interno solamente).
- Multi-tienda / marketplace.
