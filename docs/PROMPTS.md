# PROMPTS.md — Prompts sugeridos para Claude Code

> Esto es una **guía**, no un script. Cada prompt asume que el anterior ya se ejecutó. Adáptalos al estado real del proyecto.

---

## Prompt 1 — Onboarding del agente

```
Estás a cargo de construir donot-platform, una plataforma e-commerce
para una donutería boutique chilena. Tu primera tarea es entender el
proyecto.

Pasos:
1. Lee CLAUDE.md de raíz a fondo.
2. Lee los documentos en docs/ en este orden:
   - SPEC.md
   - PRODUCT_CATALOG.md
   - DESIGN_SYSTEM.md
   - MOCKUP_REFERENCE.md
   - PAYMENT_INTEGRATIONS.md
   - BACKLOG.md
3. Explora la estructura del repo con `ls` y `tree`.
4. Verifica que la carpeta donot-material/ tenga los assets esperados
   listados en CLAUDE.md.
5. Cuéntame:
   a. En 3-5 frases, qué es el proyecto.
   b. Cuál es el sprint activo.
   c. Si la carpeta donot-material/ está completa o falta algo.
   d. Qué necesitas de mí antes de empezar el primer sprint.

No escribas código todavía.
```

---

## Prompt 2 — Sprint 0 (Setup)

```
Vamos al Sprint 0 — Setup del proyecto del BACKLOG.md.

Recorre los checkboxes en orden:
1. Verifica los assets de donot-material/.
2. Cópialos a public/brand/ y public/menu/ con los slugs documentados
   en PRODUCT_CATALOG.md.
3. Instala dependencias.
4. Levanta Postgres con docker compose.
5. Migra y semilla la base de datos.
6. Arranca el servidor de desarrollo.

Después de cada paso, muéstrame el output relevante. Si encuentras un
problema (puerto ocupado, dependencia faltante, etc.), pausá y
preguntá antes de improvisar.

Cuando termines, abre Prisma Studio y confirmá que el Droop 001 con
sus 8 sabores y las 4 cajas están en la BD.
```

---

## Prompt 3 — Sprint 1 (Sistema visual y layout)

```
Sprint 1 del BACKLOG.md.

Antes de empezar, releé DESIGN_SYSTEM.md, especialmente las secciones
de paleta, tipografías, mascota y tono de copy.

Después construí, en este orden:
1. Carga de fuentes Sniglet (peso 800) e Inter en app/layout.tsx
2. Componente <Header /> con el logo verde sobre crema y nav simple.
3. Componente <Footer /> con fondo verde, logo crema y mascota
   azul/naranjo en una esquina.
4. Página / con hero y CTA "Ver el drop".
5. Páginas /sobre-nosotros y /contacto (placeholders).

Mostrame screenshots o navegá conmigo al dev server cuando termines.
Quiero que la home se vea reconociblemente "donot." al cargarla.
```

---

## Prompt 4 — Sprint 2 (Configurador)

```
Sprint 2 del BACKLOG.md — el configurador es la pieza central del
producto.

Antes de codear:
1. Releé MOCKUP_REFERENCE.md.
2. Hacé web_fetch a https://app.optify.cl/presentaciones/prueba.html
   para confirmar que entendiste el flujo de 2 pasos.
3. Releé la sección de catálogo en PRODUCT_CATALOG.md — los nombres y
   descripciones de los sabores son palabra por palabra. No los
   reformules.

Construí los endpoints de catálogo, las páginas /droop/[slug] y
/caja/[slug] con el configurador, y la persistencia en localStorage.

Atendé especialmente:
- Mobile-first (probá en viewport 375px).
- Cards Azucaradas con overlay "Próximamente" porque están inactivas
  en MVP.
- Contador X/N visible en mobile (sticky al header).
- Botón sticky al fondo en mobile.

Cuando termines, configurá una Cajita 6 Premium con 6 sabores
distintos y mostrame cómo queda en mobile y desktop.
```

---

## Prompt 5 — Sprint 4 (Mercado Pago end-to-end)

```
Sprint 4 — el más crítico técnicamente.

Antes de tocar código:
1. Releé PAYMENT_INTEGRATIONS.md sección Mercado Pago completa.
2. Asegurate de tener MP_ACCESS_TOKEN en .env (cuenta sandbox).

Construí la arquitectura de adapters como dice el doc:
- lib/payments/types.ts con la interface
- lib/payments/mercadopago.ts con la implementación
- lib/payments/index.ts factory

Después implementá:
- POST /api/checkout que crea la Order y la preference
- POST /api/webhook/mercadopago con validación de firma e idempotencia
- Plantilla HTML de email "confirmación" con la mascota
- Páginas /checkout/exito y /checkout/error
- Página /pedido/[token] de tracking público

Quiero ver una compra real funcionando de punta a punta:
- Configurás un carrito
- Pagás con tarjeta de prueba
- Llega el email
- El pedido aparece como PAID en /pedido/[token]
- El stock de los sabores comprados bajó

No avancemos al siguiente sprint hasta que esto funcione 100%.
```

---

## Patrón general para prompts de sprints

Para cada sprint, seguí esta estructura:

1. **Lectura previa obligatoria** (qué docs releer antes).
2. **Lo que vamos a construir** (lista corta).
3. **Restricciones especiales** (mobile-first, copy literal, etc.).
4. **Definition of done** (qué quiero ver al final).

Si Claude Code se desvía, traé el foco con frases tipo:

```
Pausá. Releé el DESIGN_SYSTEM.md sección 4 ("Tono de copy"). Los
copies que pusiste no están en ese registro. Reescribilos.
```

```
El nombre del sabor es "Pie de Limón" exactamente, con tilde, según
PRODUCT_CATALOG.md. No es "pie de limon" ni "Lemon Pie".
```

```
Estás usando #005341 hardcodeado. Usá el token donot.verde de Tailwind.
```

---

## Cuando algo se rompe

```
El [endpoint X / página Y / build] falla con [error]. Antes de
arreglarlo:
1. Mostrame el error completo y el stack trace.
2. Identificá la causa raíz, no el síntoma.
3. Proponé la solución mínima que respete las restricciones del SPEC
   y no introduzca packages nuevos sin avisar.
4. Después de arreglarlo, agregá un test que cubra ese caso.
```

---

## Cuando termines un sprint

```
Sprint [N] terminado.
1. Marcá todos los checkboxes en BACKLOG.md.
2. Actualizá el header del archivo con el siguiente sprint activo.
3. Hacé un commit con mensaje "feat: completar sprint N — [título]".
4. Mostrame un resumen de lo entregado y de las decisiones técnicas
   que tomaste durante el sprint.
```
