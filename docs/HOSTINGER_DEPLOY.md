# Deploy en Hostinger (integración nativa con GitHub)

Hostinger Cloud Hosting ofrece una integración directa con GitHub que clona el
repo, instala dependencias, builda y reinicia la app automáticamente cada vez
que hay push a `main`. No necesitamos webhook custom, tarball, ni SSH después
del primer setup.

## Pre-requisitos en hPanel

1. **Dominio `donot.cl`** activo y SSL emitido (Let's Encrypt).
2. **Base de datos MySQL** creada (Bases de datos → MySQL):
   - Nombre: `donot_prod` (queda como `u530306321_donot_prod`)
   - Usuario: `donot_app` (queda como `u530306321_donot_app`)
   - **Anotá el password** — va en `DATABASE_URL`.
3. **Sitio web → donot.cl → Importar desde GitHub**:
   - Repositorio: `andresradrigan-lab/donot`
   - Branch: `main`
   - Framework preset: **Next.js**
   - Node version: **20.x**
   - Root directory: `./`
   - Build settings: Default for Next.js

## Variables de entorno

En el wizard antes de darle Deploy, click en **Add** sobre Environment
variables y pegá las del bloque siguiente (reemplazá los `CAMBIAR_*`):

```
NODE_ENV=production
APP_URL=https://donot.cl

DATABASE_URL=mysql://u530306321_donot_app:CAMBIAR_PASS@localhost:3306/u530306321_donot_prod

JWT_SECRET=CAMBIAR_GENERAR_CON_OPENSSL_RAND_BASE64_32
ADMIN_INITIAL_EMAIL=andresradrigan@morgansmedia.cl
ADMIN_INITIAL_PASSWORD=changeme_in_first_login

MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=hola@donot.cl
SMTP_PASS=CAMBIAR_PASS_BUZON
SMTP_FROM_EMAIL=hola@donot.cl
SMTP_FROM_NAME=donot.

DEFAULT_FREE_SHIPPING_THRESHOLD_CLP=50000
DEFAULT_FREE_SHIPPING_MIN_BOXES=3
ORDER_NUMBER_PREFIX=DN
```

Generá `JWT_SECRET` con:

```bash
openssl rand -base64 32
```

## Primer deploy

1. Con la BD y env vars listas, dale **Deploy** en el wizard.
2. Hostinger hace: `git clone` → `npm install` (corre `postinstall` que
   genera Prisma client) → `npm run build` → arranca con `npm start`.
3. Si el build falla por falta de tablas, no pasa nada: el build de Next no
   toca la BD. La primera petición HTTP sí — por eso el siguiente paso.

## Aplicar migraciones (1 sola vez)

Después del primer deploy exitoso, hay que crear las tablas. Dos opciones:

### Opción A — phpMyAdmin (sin SSH, recomendado)

1. hPanel → Bases de datos → MySQL → phpMyAdmin sobre `u530306321_donot_prod`.
2. Pestaña **Importar** → seleccioná uno por uno los archivos en
   `prisma/migrations/*/migration.sql` del repo y ejecutalos en orden
   cronológico.
3. Después corré el seed manualmente (ver Opción B paso 3) o creá el primer
   admin desde phpMyAdmin con un INSERT en `AdminUser`.

### Opción B — SSH (1 sesión, ~2 min)

```bash
ssh -p 65002 u530306321@147.79.93.218

cd ~/domains/donot.cl/public_html
# Hostinger pone el código clonado acá (verificá la ruta exacta con `pwd` y `ls`).

# Aplicar migraciones
npx prisma migrate deploy

# Seed inicial (Droop 001 + 8 sabores + 4 cajas + admin)
npm run db:seed
```

> Si `prisma migrate deploy` falla con MariaDB 11, importá los SQL por
> phpMyAdmin (Opción A) y registrá manualmente cada migración en
> `_prisma_migrations` con el hash correspondiente.

## Verificación

```bash
curl https://donot.cl/api/health
# → 200 con { ok: true }
```

Login admin: `https://donot.cl/admin/login` con
`andresradrigan@morgansmedia.cl` / `changeme_in_first_login`. Cambialo en
`/admin/usuarios` apenas entres.

## Deploys siguientes

Cada `git push origin main` dispara automáticamente:
- Hostinger detecta el push
- Pull de los cambios
- `npm install` + `npm run build`
- Restart de la app

Tiempo total: ~2-4 min. Sin tu intervención.

## Rollback

hPanel → Sitios web → donot.cl → Deployments → click en una deployment
anterior → **Redeploy**. Hostinger hace checkout de ese commit y rebuilda.

## Troubleshooting

- **Build falla con `Cannot find module '@prisma/client'`**: el
  `postinstall` no corrió. Verificá que `package.json` tenga el script y que
  `prisma` esté en `devDependencies` (lo está).
- **Runtime: `P1000` o `Access denied`**: revisá `DATABASE_URL`. En
  Hostinger Cloud el host debe ser `localhost` y el cliente Prisma usa el
  socket Unix `/var/lib/mysql/mysql.sock` automáticamente
  (ver `lib/db.ts`).
- **Páginas estáticas que necesitan BD**: si Next intenta SSG una página
  que llama a Prisma, falla en build. Asegurate que esa ruta tenga
  `export const dynamic = 'force-dynamic'`.
- **CSP bloqueando MP / GTM**: revisá los `headers()` en `next.config.js`.
