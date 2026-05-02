# PAYMENT_INTEGRATIONS.md — Pasarelas de pago chilenas

> Tres pasarelas, todas opcionales en checkout. El cliente decide cuál usar al pagar. Lee este documento ANTES de tocar nada relacionado a pagos.

---

## Reglas comunes a las tres

1. **Una sola cuota** en tarjeta de crédito. Sin cuotas sin interés del comercio.
2. **Nunca almacenar datos de tarjeta.** El flujo es 100% redirigido a la pasarela. PCI scope = SAQ-A.
3. La `Order` se crea en BD con `status=PENDING`, `payment_status=PENDING` ANTES de redirigir.
4. El estado real se confirma vía webhook (MP, Khipu) o commit síncrono (Webpay).
5. Idempotencia obligatoria: cada `payment_id` se procesa una sola vez, validando contra `WebhookLog`.
6. Validación de firma/origen en webhooks cuando la pasarela lo soporta.
7. Si webhook llega antes que el redirect del usuario, `/checkout/exito` debe consultar el estado actual al cargar (no asumir).

---

## 1. Mercado Pago (priorizada)

**SDK:** `@mercadopago/sdk-nodejs` (Node 16+).

**Modo recomendado:** Checkout Pro con Wallet Brick embebido en `/checkout`.

**Locale:** `es-CL`.

### Flujo

```
1. Usuario en /checkout selecciona MP y confirma.
2. Backend → POST /api/checkout
   - Crea Order(status=PENDING)
   - Llama a MP API: preference.create({
       items: [{ title, quantity, unit_price, currency_id: "CLP" }],
       external_reference: order.id,
       back_urls: {
         success: APP_URL + "/checkout/exito",
         failure: APP_URL + "/checkout/error",
         pending: APP_URL + "/checkout/exito",
       },
       auto_return: "approved",
       notification_url: APP_URL + "/api/webhook/mercadopago",
       payment_methods: {
         installments: 1,  // ← una sola cuota
       },
     })
   - Recibe { id, init_point } y guarda preference.id en Order
   - Retorna init_point al frontend
3. Frontend redirige a init_point (o monta Wallet Brick con preferenceId)
4. Usuario paga en MP
5. MP redirige a /checkout/exito?payment_id=...&status=approved
6. En paralelo, MP envía POST a /api/webhook/mercadopago con
   { action: "payment.updated", data: { id: payment_id } }
7. Webhook handler:
   - Valida que el payment_id no esté en WebhookLog
   - Llama a MP API: payments.get(payment_id) para verificar estado real
   - Si approved: Order.payment_status = APPROVED, Order.status = PAID
   - Decrementa stock de sabores
   - Dispara email al cliente
   - Inserta en WebhookLog
```

### Variables de entorno

```
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=...
```

### Validación de webhook

Mercado Pago envía un header `x-signature` con un HMAC. Validarlo según [docs](https://www.mercadopago.com.cl/developers/es/docs/your-integrations/notifications/webhooks).

### Sandbox

Credenciales de prueba en panel de MP. Tarjetas de prueba documentadas. Misma URL de API, mismo flujo, dinero ficticio.

---

## 2. Transbank Webpay Plus

**SDK:** `transbank-sdk` (oficial).

**Modo:** Webpay Plus (commit síncrono — no usa webhooks tradicionales).

### Flujo

```
1. Usuario en /checkout selecciona Webpay y confirma.
2. Backend → POST /api/checkout
   - Crea Order(status=PENDING)
   - Llama a Transbank: tx.create({
       buyOrder: order.id,        // máx 26 chars
       sessionId: ...,             // máx 61 chars
       amount: total_clp,
       returnUrl: APP_URL + "/api/webhook/transbank/return",
     })
   - Recibe { url, token }
   - Retorna { url, token } al frontend
3. Frontend hace POST automático a `url` con campo `token_ws=token`
   (no es redirect; es un form auto-submit)
4. Usuario paga en Webpay
5. Webpay hace POST de vuelta a returnUrl con `token_ws` en body
6. Handler de /api/webhook/transbank/return:
   - tx.commit(token_ws) → confirma la transacción
   - Si status === "AUTHORIZED": Order PAID
   - Inserta en WebhookLog
   - Hace 302 a /checkout/exito
```

### Variables de entorno

```
TBK_COMMERCE_CODE=...
TBK_API_KEY=...
TBK_ENV=production  # o "integration" para sandbox
```

### Sandbox

Credenciales públicas en [docs de Transbank](https://www.transbankdevelopers.cl/). Tarjetas de prueba: VISA `4051885600446623` con cualquier CVV y fecha futura.

### Producción

Requiere afiliación con Transbank (proceso de 1–3 semanas que el cliente debe gestionar). Mientras tanto, en `TBK_ENV=integration` se puede testear.

---

## 3. Khipu

**SDK:** No tiene SDK oficial Node — se usa fetch directo a la API v3.

**Modo:** Pago instantáneo por transferencia bancaria.

### Flujo

```
1. Usuario en /checkout selecciona Khipu y confirma.
2. Backend → POST /api/checkout
   - Crea Order(status=PENDING)
   - POST https://payment-api.khipu.com/v3/payments
       headers: { x-api-key: KHIPU_API_KEY }
       body: {
         subject: "Pedido " + order.order_number,
         amount: total_clp,
         currency: "CLP",
         transaction_id: order.id,
         return_url: APP_URL + "/checkout/exito",
         cancel_url: APP_URL + "/checkout/error",
         notify_url: APP_URL + "/api/webhook/khipu",
         notify_api_version: "3.0",
       }
   - Recibe { payment_id, payment_url, simplified_transfer_url }
   - Guarda payment_id en Order
   - Retorna payment_url al frontend
3. Frontend redirige a payment_url
4. Usuario paga via banco
5. Khipu redirige a return_url (no incluye estado — solo es UX)
6. Khipu envía POST a notify_url con body { notification_token, ... }
7. Handler de /api/webhook/khipu:
   - Recibe notification_token
   - GET https://payment-api.khipu.com/v3/payments/{id}
       headers: { x-api-key: KHIPU_API_KEY }
       query: ?notification_token=...
   - Si status === "done": Order PAID
   - Inserta en WebhookLog
```

### Variables de entorno

```
KHIPU_RECEIVER_ID=...
KHIPU_API_KEY=...
```

### Sandbox

Khipu no tiene ambiente separado. Se usa una "cuenta de cobro en modo desarrollador" que opera contra la misma API con dinero ficticio. Crear cuenta de desarrollador en panel Khipu.

---

## Patrón compartido — donde poner el código

```
lib/
├── payments/
│   ├── index.ts              # Factory: getProvider(name) → MercadoPago | Transbank | Khipu
│   ├── types.ts              # Interface PaymentProvider (createTransaction, getStatus)
│   ├── mercadopago.ts        # Implementación MP
│   ├── transbank.ts          # Implementación Webpay
│   └── khipu.ts              # Implementación Khipu
└── webhooks/
    ├── verify-mercadopago.ts # Valida firma HMAC
    ├── verify-khipu.ts       # Valida notification_token
    └── log.ts                # Helper para insertar en WebhookLog (idempotencia)
```

Cada implementación expone:

```ts
interface PaymentProvider {
  createTransaction(order: Order): Promise<{ paymentId: string; redirectUrl: string }>
  getStatus(paymentId: string): Promise<'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED'>
}
```

El handler `/api/checkout` recibe el provider name y delega al adapter correcto. El handler de webhooks valida, consulta y delega también.

---

## Manejo de fallas y conciliación

### Cron diario (00:30 CLT)

```ts
// scripts/cron-cleanup-pending.ts
// Para cada Order con status=PENDING y created_at > 30 min atrás:
//   - Marcarla como CANCELLED
//   - Liberar stock reservado (si lo hubo)
//   - No notificar al cliente (estos son carros abandonados)
```

### Cron horario

```ts
// scripts/cron-reconcile.ts
// Para cada Order con status=PENDING y payment_id != null:
//   - Consultar estado real en la pasarela
//   - Si difiere, aplicar corrección
//   - Util para casos donde el webhook no llegó (queda como respaldo)
```

### Reintentos de mail

Si el envío de email falla, encolar reintento con backoff exponencial (1 min, 5 min, 30 min). 3 intentos máximo. Luego notificar al admin.

---

## Tests recomendados (mínimo)

- Crear Order, simular webhook MP de pago aprobado, verificar que `Order.status = PAID`.
- Mismo webhook llegando dos veces no duplica el procesamiento (idempotencia).
- Webhook con firma inválida → 401, no procesa.
- Pago rechazado → `Order.status` se mantiene PENDING (o pasa a CANCELLED según política).
