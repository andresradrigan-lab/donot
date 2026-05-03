# HANDOFF — Estado del proyecto al 2026-05-03

Documento de transferencia para continuar el desarrollo (especialmente
trabajo de UX/UI). Léelo completo antes de tocar código.

---

## TL;DR

- **donot.** está en producción en `https://donot.cl`.
- E-commerce + back-office completos, deploy automático funcionando,
  BD cargada con catálogo real, Mercado Pago integrado.
- Lo que sigue es pulido visual, performance, accesibilidad, mobile UX.
- **No** tocar arquitectura ni features sin pedirlo: la base está estable.

---

## Stack (no cambiar sin razón fuerte)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 14 App Router | Sin `output: 'standalone'`. Hostinger usa `next start` clásico. |
| Lenguaje | TypeScript estricto | `strict: true`. Nada de `any` sin justificación. |
| Estilos | Tailwind 3 + tokens custom | Tokens `donot-verde`, `donot-crema`, `donot-rosado`, `donot-naranjo` en `tailwind.config.ts`. |
| BD | MariaDB 11 (compartida en Hostinger Cloud) | **No** Postgres. Hostinger Cloud solo ofrece MariaDB. |
| ORM | Prisma 6 + `@prisma/adapter-mariadb` | Prisma 5 falla con MariaDB 11 (P1000). El adapter sí funciona. |
| Auth admin | bcryptjs + jsonwebtoken | JWT firmado con `JWT_SECRET`. Cookie httpOnly. |
| Pagos | Mercado Pago (Bricks + webhook HMAC) | Transbank y Khipu diferidos a Fase 2. |
| Email | nodemailer (SMTP Hostinger) | Fallback opcional Resend. |
| Hosting | Hostinger Cloud Hosting (NO VPS) | LVE limita a 200 procesos por cuenta. |

---

## Cómo funciona el deploy (importante)

Es **integración nativa Hostinger ↔ GitHub**:

1. Push a `main` en `github.com/andresradrigan-lab/donot`
2. Hostinger detecta el push, clona el repo en su runner, corre
   `npm install` (incluido `postinstall: prisma generate`), `npm run build`
3. Sirve la app con Passenger + LiteSpeed desde
   `~/domains/donot.cl/nodejs/` con symlinks al build más reciente
4. Tarda ~3 min total

**No hay GitHub Actions de deploy.** El workflow `deploy.yml` se eliminó.
Solo queda `ci.yml` que valida typecheck/lint/build en cada PR.

**No hagas npm install/build en el server por SSH.** Saturás el LVE de
procesos y caes el sitio. El build solo en runners de Hostinger.

Detalles completos: `docs/HOSTINGER_DEPLOY.md`.

---

## Decisiones técnicas que parecen raras pero tienen razón

| Decisión | Por qué |
|---|---|
| `tailwindcss`, `postcss`, `autoprefixer`, `typescript`, `prisma`, `tsx`, todos los `@types/*` están en `dependencies` (no `devDependencies`) | Hostinger corre `npm install --omit=dev` cuando `NODE_ENV=production`. Los packages que se usan en build deben estar en `dependencies` o explota. |
| `postinstall: prisma generate` en `package.json` | Hostinger no corre `prisma generate` solo. |
| `previewFeatures = ["driverAdapters"]` + `binaryTargets` en `schema.prisma` | El driver adapter es la única forma de hablar con MariaDB 11. Los binary targets cubren CloudLinux (openssl 1.1) y runners Ubuntu (openssl 3). |
| `lib/db.ts` detecta `localhost` en producción y usa socket Unix `/var/lib/mysql/mysql.sock` | En Hostinger Cloud el usuario MariaDB se autoriza solo por socket. TCP a localhost falla con Access denied. |
| `lib/weekdays.ts` separado (no en `lib/catalog.ts`) | Para que componentes client puedan importar el helper sin bundlear Prisma. |
| `export const dynamic = 'force-dynamic'` en páginas que tocan BD | Si Next intenta SSG una página que llama Prisma, el build falla. |
| `availableWeekdays` y `flavors` se guardan como **JSON** | MariaDB no soporta arrays nativos. |
| Sin `output: 'standalone'` | Default Hostinger usa `next start`. Standalone con wrapper server.js fue un experimento previo que ya no aplica. |

---

## Estructura de carpetas

```
app/
  (store)/          → frontend público
    page.tsx        → home
    droop/[slug]/
    caja/[slug]/    → configurador 2 pasos
    carrito/
    checkout/
    pedido/[token]/
    blog/, blog/[slug]/
    galeria/
    sobre-nosotros/, contacto/
  (admin)/admin/
    login/
    (authed)/       → middleware verifica JWT
      dashboard, pedidos, cocina, calendario,
      droops, sabores, cajas, cupones,
      cobertura, galeria, blog, usuarios, config
  api/
    admin/*         → CRUD protegido
    webhook/mercadopago
    checkout, coupons/validate, coverage, droops/active,
    boxes, cart/validate, orders/[token], health, deploy-hook (eliminado)

components/
  ui/               → primitivos (Button, Input, Card, Modal, etc.)
  store/            → específicos tienda (Header, Footer, FlavorPicker, MiniCart, GalleryLightbox, etc.)
  admin/            → específicos admin (AdminHeader, BlogEditor, GalleryManager, OrderTable, etc.)

lib/
  db.ts             → Prisma client + adapter MariaDB (con socket)
  auth.ts           → JWT helpers
  schemas.ts        → Zod schemas público
  schemas-admin.ts  → Zod schemas admin
  cart.ts, catalog.ts, weekdays.ts, blog.ts, mp.ts, email.ts, ...

prisma/
  schema.prisma
  migrations/       → 2 migraciones aplicadas (init + gallery_blog)
  seed.ts

public/
  brand/            → 7 logos + mascota (kebab-case)
  menu/             → 8 fotos de sabores (kebab-case)
  uploads/          → no committed; uploads dinámicos
```

---

## Sistema de diseño — referencia rápida

Detalle completo: `docs/DESIGN_SYSTEM.md`. Mockup validado por cliente:
https://app.optify.cl/presentaciones/prueba.html

**Paleta:**
- Verde donot (`donot-verde`) — primario, fondos oscuros, header admin
- Crema (`donot-crema`) — fondo principal de tienda
- Rosado (`donot-rosado`) — accents, hover states
- Naranjo (`donot-naranjo`) — botones secundarios, badges
- Azul claro pastel — versión alternativa de logo

**Tipografías:** ver `app/layout.tsx`. Display + sans con `next/font`.

**Mascota:** disponible en `public/brand/mascota-*.png`. Usar en estados
vacíos, footers, success screens. NO generar versiones nuevas con IA.

**Tono de marca:** español Chile neutro, tú (no vos), informal pero
elegante. Copy oficial de productos en `docs/PRODUCT_CATALOG.md` —
**NO modificar** nombres ni descripciones de los sabores.

---

## Estado del catálogo en producción

BD `u530306321_donot_prod` ya cargada con:

- **1 Droop activo** — Droop 001 "La primera carga"
- **8 sabores premium** — Cookies & Cream, Crème Brûlée, Pie de Limón,
  Glaseada, Crocanti, Pie de Manzana, Tiramisú, Alfajor
- **4 cajas** — Caja 6 Premium ($19.990), Caja 4 Premium ($15.990),
  6 Azucaradas y 4 Azucaradas (inactivas hasta Droop 002)
- **6 zonas de cobertura** — Concón, Reñaca, Viña, Valparaíso, Quilpué,
  Villa Alemana (tarifas de $1.500 a $2.500)
- **2 cupones** — `BIENVENIDA10` (10%), `ENVIOGRATIS`
- **1 admin OWNER** — `andresradrigan@morgansmedia.cl`

Las cajas tienen `images = []` (sin fotos asignadas todavía). Eso lo
carga el cliente desde `/admin/cajas`. **No** lo metas como código.

---

## Lo que está hecho (no rehacer)

- ✅ Storefront completo (Sprints 0-11)
- ✅ Configurador de cajas en 2 pasos
- ✅ Carrito + checkout + Mercado Pago Bricks
- ✅ Webhook MP con HMAC
- ✅ Admin completo: pedidos, cocina, calendario, droops, sabores, cajas,
  cupones, cobertura, blog, galería, usuarios, config
- ✅ Blog con SEO automático (markdown editor, JSON-LD Article,
  OG/Twitter, sitemap)
- ✅ Galería con lightbox (esc + flechas)
- ✅ Mini cart drawer
- ✅ Barra de progreso de envío gratis
- ✅ Instagram embed
- ✅ SMTP transaccional (nodemailer + Hostinger)
- ✅ GTM + GA4 + Meta Pixel + CAPI server-side
- ✅ Sitemap dinámico con blog/galería
- ✅ Headers de seguridad + HSTS
- ✅ Deploy automático Hostinger ↔ GitHub
- ✅ BD migrada y seed cargado en producción

## Lo que está pendiente (próximos chats)

### Trabajo de UX/UI (próximo chat)
- Auditoría visual completa (mobile + desktop)
- Verificar consistencia con el design system
- Estados vacíos con mascota
- Microinteracciones en configurador y checkout
- Lighthouse: performance, a11y, SEO, best practices
- Loading states y skeletons
- Error states amigables
- Animaciones sutiles (Framer Motion ya disponible? si no, evaluar)

### Acción manual del cliente (no es código)
- Cargar fotos a las 4 cajas desde `/admin/cajas`
- Subir galería desde `/admin/galeria` (carpeta `~/Desktop/Donot Material/DO NOT - SEGUIMIENTO/DoNot 24 Abril/`)
- Crear los primeros blog posts desde `/admin/blog`
- Cambiar pass admin desde `/admin/usuarios`
- Confirmar direcciones de retiro Concón/Reñaca en `/admin/config`
- Cargar `SMTP_PASS=DoNot2026.` en env vars de Hostinger
- Generar y cargar `MP_WEBHOOK_SECRET` desde panel de Mercado Pago
- Probar pedido real end-to-end

### Diferido a Fase 2 (NO trabajar sin pedido explícito)
- WhatsApp QR recovery (recuperación de carrito vía WA)
- Cuentas de cliente + login + GPS
- Transbank Webpay Plus
- Khipu (transferencia bancaria)

---

## Reglas para el agente nuevo

1. **Leé primero, codeá después.** Orden:
   1. `CLAUDE.md` (raíz)
   2. `docs/HANDOFF.md` (este doc)
   3. `docs/SPEC.md`
   4. `docs/PRODUCT_CATALOG.md`
   5. `docs/DESIGN_SYSTEM.md`
   6. `docs/HOSTINGER_DEPLOY.md`
   7. `docs/BACKLOG.md`

2. **Nada de SSH directo si se puede hacer por GitHub.** El usuario lo
   pidió explícitamente. Cambios de código = commit + push. SSH solo
   para inspección puntual.

3. **Hostinger Cloud tiene LVE de 200 procesos.** No corras `npm install`
   ni builds en el server. Saturalo y se cae el sitio.

4. **No instales packages especulativos.** Si no está en `package.json`
   o no lo pidió el SPEC, preguntá antes.

5. **No modifiques nombres ni descripciones oficiales de sabores.** Están
   en `docs/PRODUCT_CATALOG.md` palabra por palabra. El cliente las validó.

6. **No uses imágenes generadas por IA.** Solo las del cliente, en
   `public/brand/` y `public/menu/`. Si faltan assets, los originales
   están en `~/Desktop/Donot Material/`.

7. **Server Components por defecto.** `"use client"` solo si necesitás
   estado, hooks, o eventos del navegador.

8. **Validación con Zod** en todo input que cruza límite servidor/cliente.

9. **Idioma del código:** inglés (variables, funciones, comentarios).
   **Idioma del copy de UI:** español Chile neutro (tú, no vos).

10. **TypeScript estricto.** Nada de `any` sin justificación documentada.

11. **TodoWrite** para tareas de >2 pasos.

12. **No commitees `.env`** ni secretos. Solo `.env.example`.

13. **Si encontrás contradicciones** entre docs, avisá al usuario, no
    inventes una resolución.

---

## Accesos

> **Nota de seguridad:** estas credenciales son de un entorno de
> producción real en uso por el cliente. Tratalas como sensibles.

### GitHub
- Repo: `github.com/andresradrigan-lab/donot`
- Branch principal: `main`
- El usuario ya tiene push access desde su Mac.

### Servidor Hostinger (SSH)
- Host: `147.79.93.218`
- Puerto: `65002`
- Usuario: `u530306321`
- Comando: `ssh -p 65002 u530306321@147.79.93.218`
- Llave SSH ya instalada en `~/.ssh/authorized_keys` del server.

### Base de datos MariaDB
- Host: `localhost` (socket Unix `/var/lib/mysql/mysql.sock`)
- Puerto TCP: `3306` (solo si vas a usar TCP, en producción usá socket)
- Base: `u530306321_donot_prod`
- Usuario: `u530306321_donot_app`
- Password: `Bart2131.`
- phpMyAdmin: hPanel → Bases de datos → MySQL → "Enter phpMyAdmin"

Acceso por SSH:
```bash
ssh -p 65002 u530306321@147.79.93.218
MYSQL_PWD='Bart2131.' mariadb -u u530306321_donot_app u530306321_donot_prod
```

### Admin web (donot.cl)
- URL: `https://donot.cl/admin/login`
- Email: `andresradrigan@morgansmedia.cl`
- Pass inicial: `changeme_in_first_login`
  - El usuario debe cambiarla en `/admin/usuarios` apenas entre.

### Mercado Pago (producción)
- Access token y public key están en env vars de Hostinger.
- `MP_WEBHOOK_SECRET` está vacío — el cliente debe generarlo en el
  panel de MP y pegarlo.

### SMTP (Hostinger Email)
- Host: `smtp.hostinger.com`
- Puerto: `465`
- Usuario: `hola@donot.cl`
- Pass: `DoNot2026.`
- El cliente debe cargar `SMTP_PASS` en env vars de Hostinger.

### Carpeta de assets del cliente (Mac local)
- Ruta: `~/Desktop/Donot Material/`
- Contiene: logos, mascota, fotos del menú, ~99 fotos del local/producto
  en `DO NOT - SEGUIMIENTO/DoNot 24 Abril/`
- Los assets de marca y menú **ya están copiados** a `public/brand/` y
  `public/menu/` con nombres en kebab-case. **No** muevas el original.

---

## Comandos útiles

```bash
# Local
npm run dev                 # localhost:3000
npm run typecheck
npm run build
npm run lint

# BD local (si tenés docker)
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npx prisma studio

# Server (SSH)
ssh -p 65002 u530306321@147.79.93.218
MYSQL_PWD='Bart2131.' mariadb -u u530306321_donot_app u530306321_donot_prod -e "SELECT COUNT(*) FROM Flavor;"

# Health check producción
curl https://donot.cl/api/health
```
