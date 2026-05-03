# CLAUDE.md — Instrucciones para el agente

> **Este archivo es lo PRIMERO que debes leer.** Te pone en contexto del proyecto antes de tocar código. Después de leerlo, lee los documentos en `docs/` en el orden indicado abajo.

---

## El proyecto en 30 segundos

**donot.** es una donutería boutique de Concón–Reñaca (Chile, V Región) que abrió su local físico el 2 de mayo de 2026. Actualmente vende solo por DM/Instagram. Estamos construyendo su plataforma e-commerce: tienda online + back-office completo + integración a pasarelas chilenas (Mercado Pago, Transbank Webpay Plus, Khipu).

El producto se organiza en **Droops** (colecciones limitadas de sabores). El Droop 001 ya está activo con 8 sabores premium documentados.

**Cliente:** Donut (Fernanda Rojas — Optify)
**Solution Architect:** Andrés Radrigán (MorgansMedia)
**Stack:** Next.js 14 + TypeScript + PostgreSQL + Prisma + Tailwind, sobre Hostinger VPS.

---

## Orden de lectura obligatorio

Antes de escribir una sola línea de código, lee estos documentos **en este orden**:

1. **`docs/HANDOFF.md`** — Estado actual del proyecto en producción, decisiones técnicas críticas, accesos, reglas para el agente
2. **`docs/SPEC.md`** — Qué se construye y cómo se comporta
3. **`docs/PRODUCT_CATALOG.md`** — Productos reales (Droops, cajas, sabores) con precios y descripciones oficiales
4. **`docs/DESIGN_SYSTEM.md`** — Paleta, tipografías, copy, mascota, tono de marca
5. **`docs/MOCKUP_REFERENCE.md`** — Descripción del flujo de configurador en 2 pasos del mockup vigente
6. **`docs/HOSTINGER_DEPLOY.md`** — Cómo se deploya (integración nativa Hostinger ↔ GitHub)
7. **`docs/PAYMENT_INTEGRATIONS.md`** — Detalle técnico de las pasarelas chilenas
8. **`docs/BACKLOG.md`** — Sprints completados + estado actual

> **El proyecto YA ESTÁ EN PRODUCCIÓN** en `https://donot.cl`. La fase
> actual es pulido de UX/UI y operación, no construcción de features.
> Léelo `HANDOFF.md` antes de cualquier cosa.

---

## Assets de marca

La carpeta `donot-material/` debe contener los assets que el cliente proporcionó (logos, mascota, fotografías de los sabores). El usuario es responsable de copiar el contenido de su carpeta de Desktop a esta ubicación antes de iniciar el proyecto.

**Nunca asumas que los assets existen sin verificarlo.** Si la carpeta `donot-material/` está vacía o le faltan archivos, detente y avísale al usuario qué falta antes de continuar.

Estructura esperada de `donot-material/`:

```
donot-material/
├── brand/
│   ├── Do Not Verde Fondo Crema.png       (logo principal)
│   ├── Do Not Crema Fondo Verde.png
│   ├── Do Not Naranjo Fondo Azul Claro Pastel.png
│   ├── Do Not Rosado Fondo Verde.png
│   ├── Do Not Verde Fondo Rosado.png
│   ├── Mascota Do Not Crema Verde.png      (mascota canónica)
│   └── Mascota Do Not Azul y Naranjo.png
└── menu/
    ├── 21.png  (Cookies & Cream)
    ├── 22.png  (Crème Brûlée)
    ├── 23.png  (Pie de Limón)
    ├── 24.png  (Glaseada)
    ├── 25.png  (Crocanti)
    ├── 26.png  (Pie de Manzana)
    ├── 27.png  (Tiramisú)
    └── 28.png  (Alfajor)
```

**Cuando uses estos assets:** cópialos (no los muevas) a `public/brand/` y `public/menu/` con nombres normalizados en kebab-case (ej. `cookies-and-cream.png`). El mapeo está en `docs/PRODUCT_CATALOG.md`.

---

## Mockup de referencia

El cliente validó un mockup HTML del flujo de configurador. Está en:
**https://app.optify.cl/presentaciones/prueba.html**

Léelo con web_fetch o tu equivalente al inicio del Sprint 2 (storefront). El flujo es de 2 pasos:
1. Selección de tipo de caja (4 opciones)
2. Selección de sabores hasta llenar los slots de la caja (4 o 6)

La descripción detallada del flujo está en `docs/MOCKUP_REFERENCE.md`. Respeta el flujo del mockup pero aplica el sistema de diseño oficial (paleta, tipografías y mascota están en `DESIGN_SYSTEM.md`).

---

## Stack y comandos

```bash
# Setup inicial (solo una vez)
npm install
docker compose up -d        # Levanta Postgres en localhost:5432
npx prisma migrate dev      # Aplica migraciones y crea la base
npx prisma db seed          # Carga Droop 001 + 8 sabores + 4 cajas

# Desarrollo
npm run dev                 # Next.js en localhost:3000

# Otros
npx prisma studio           # GUI para inspeccionar la BD
npm run lint
npm run typecheck
npm run build
```

Si `docker compose` no está disponible, fallback a Postgres instalado localmente — actualiza `DATABASE_URL` en `.env`.

---

## Convenciones de código

- **TypeScript estricto.** `strict: true` en tsconfig. Nada de `any` salvo justificación documentada.
- **Server Components por defecto** en App Router. Marca `"use client"` solo cuando necesites interactividad o hooks.
- **Validación con Zod** en todo input que cruce el límite servidor/cliente (formularios, route handlers, env vars).
- **Estructura de rutas:**
  - `app/(store)/` — tienda pública
  - `app/(admin)/admin/` — back-office (con middleware de auth)
  - `app/api/` — route handlers
- **Componentes:**
  - `components/ui/` — primitivos (Button, Input, Card)
  - `components/store/` — específicos de tienda
  - `components/admin/` — específicos de admin
- **Naming:**
  - Archivos de componentes: `PascalCase.tsx`
  - Archivos utilitarios: `kebab-case.ts`
  - Variables y funciones: `camelCase`
  - Constantes globales: `SCREAMING_SNAKE_CASE`
- **Idioma del código:** inglés (variables, funciones, comentarios técnicos).
- **Idioma del copy de UI:** español Chile neutro (tú, no vos). Tono de marca en `DESIGN_SYSTEM.md`.

---

## Reglas no negociables

1. **Nunca commitees `.env`.** Solo `.env.example` con valores ficticios.
2. **Nunca commitees secretos.** Si encuentras una clave hardcodeada, detente y muévela a env vars.
3. **No instales packages especulativos.** Si una dependencia no está en `package.json` o no la pidió el SPEC, pregunta antes.
4. **No deshabilites linters/typechecks.** Si hay errores, arréglalos en lugar de silenciarlos.
5. **No toques `donot-material/`.** Solo léela. La canonical lives ahí.
6. **No uses imágenes generadas por IA.** Solo las del cliente.
7. **Conserva los nombres oficiales de los sabores y descripciones.** Están en `PRODUCT_CATALOG.md` palabra por palabra.
8. **Pasarelas:** lee `PAYMENT_INTEGRATIONS.md` antes de tocar nada relacionado a pagos. NUNCA almacenes datos de tarjeta — el flujo es 100% redirigido.

---

## Cuando tengas dudas

- Si una decisión es de **producto** (qué hace el sistema): pregunta al usuario.
- Si una decisión es **técnica** (cómo lo hace): aplica el principio más simple que cumpla el SPEC y déjalo documentado en un comentario.
- Si encuentras una contradicción entre documentos: avísale al usuario, no inventes una resolución.

---

## Estado del proyecto

Mira el header de `BACKLOG.md`. Ahí dice cuál es el sprint activo. Cuando empieces a trabajar en un sprint, márcalo como "en progreso" en ese mismo header.
