# DEPLOY.md — Cómo subir donot.cl a producción (Hostinger Cloud Hosting)

> Esta guía asume **Hostinger Cloud Hosting** (no VPS). El servidor ya
> tiene Node 20 disponible vía nvm, MariaDB compartido, PM2 y Git. SSH
> en el puerto **65002**. Hostinger maneja Apache + SSL + dominios desde
> hPanel; tú solo configuras tu app Node.js apuntando al directorio del
> dominio.

Servidor actual:
- IP: `147.79.93.218`
- SSH: `ssh -p 65002 u530306321@147.79.93.218`
- Path home: `/home/u530306321/`
- Path app: `~/donot-platform/`

---

## 0. Antes de empezar — checklist

- [x] Dominio `donot.cl` agregado en hPanel → Dominios
- [x] Llave SSH instalada en `~/.ssh/authorized_keys` (ya hecho)
- [ ] BD MariaDB creada en hPanel
- [ ] Aplicación Node.js registrada en hPanel apuntando a `~/donot-platform/current/`
- [ ] Credenciales productivas de Mercado Pago
- [ ] Cuenta Resend con dominio `donot.cl` verificado

---

## 1. Crear la BD MariaDB en hPanel (3 min)

1. **hPanel → Bases de datos → MySQL**
2. Click en **"Crear nueva base de datos"** o "Add new database"
3. Datos:
   - **Nombre BD:** `donot_prod` (queda `u530306321_donot_prod` con prefijo)
   - **Usuario:** `donot_app` (queda `u530306321_donot_app`)
   - **Contraseña:** generala fuerte y guárdala
4. **Charset:** `utf8mb4`, collation `utf8mb4_unicode_ci`
5. Anota:
   - Host: `localhost`
   - Puerto: `3306`
   - DB name (con prefijo)
   - User (con prefijo)
   - Password

---

## 2. Crear la aplicación Node.js en hPanel (3 min)

1. **hPanel → Avanzado → Aplicaciones Node.js → "Crear aplicación"**
2. Datos:
   - **Versión Node:** `20.x` (debe estar `>= 20`)
   - **Application root:** `/home/u530306321/donot-platform/current/`
   - **Application URL:** `donot.cl`
   - **Application startup file:** `.next/standalone/server.js`
   - **Modo:** `production`
3. Guardar. Hostinger asigna un puerto interno y configura el reverse
   proxy automáticamente.

---

## 3. Pegar las variables de entorno en el servidor

```bash
ssh -p 65002 u530306321@147.79.93.218
mkdir -p ~/donot-platform/{shared,releases,backups}
mkdir -p ~/donot-platform/shared/uploads
nano ~/donot-platform/shared/.env.production
```

Pega el contenido de [`deploy/env.production.example`](../deploy/env.production.example)
y reemplaza:

| Variable | De dónde sacarla |
|---|---|
| `DATABASE_URL` | `mysql://u530306321_donot_app:<pass>@localhost:3306/u530306321_donot_prod` |
| `JWT_SECRET` | `openssl rand -base64 32` (en tu local) |
| `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` | panel de Mercado Pago → Producción |
| `MP_WEBHOOK_SECRET` | activa firma de webhooks en MP, pega el secret |
| `RESEND_API_KEY` | resend.com → API Keys, después de verificar dominio |

```bash
chmod 600 ~/donot-platform/shared/.env.production
```

---

## 4. Configurar GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → **New repository secret**.

| Secret | Valor |
|---|---|
| `DEPLOY_HOST` | `147.79.93.218` |
| `DEPLOY_USER` | `u530306321` |
| `DEPLOY_SSH_KEY` | contenido completo de la llave **privada** (`donot_hostinger`) |

También crear un *Environment* `production` con required reviewers si
quieres gatear deploys manualmente.

---

## 5. Primer deploy

Push a `main` o "Run workflow" desde la pestaña Actions.

El workflow:
1. `npm ci` + `prisma generate` + `npm run build` (standalone)
2. Empaqueta `.next/` + `public/` + `prisma/` + `deploy/` + `package*.json` + `ecosystem.config.js`
3. `rsync` por SSH al servidor en `~/donot-platform/releases/<timestamp>-<sha>/`
4. Corre [`release.sh`](../deploy/scripts/release.sh) en el servidor:
   - Enlaza `.env.production` y `public/uploads/` desde `shared/`
   - `prisma migrate deploy`
   - Mueve el symlink `current/`
   - `pm2 reload`
5. Hace `curl https://donot.cl/api/health` y falla si no responde 200

---

## 6. Seed inicial (solo la primera vez)

Después del primer deploy exitoso:

```bash
ssh -p 65002 u530306321@147.79.93.218
cd ~/donot-platform/current
. ~/.nvm/nvm.sh && nvm use 20
DATABASE_URL="$(grep DATABASE_URL ~/donot-platform/shared/.env.production | cut -d= -f2-)" \
  npx prisma db seed
```

Login admin: `https://donot.cl/admin/login`
- Email: el que dejaste en `ADMIN_INITIAL_EMAIL`
- Password: el de `ADMIN_INITIAL_PASSWORD` — **cámbiala apenas entres** desde `/admin/usuarios`

---

## 7. UptimeRobot

Crear monitor HTTP(S) en [uptimerobot.com](https://uptimerobot.com):
- URL: `https://donot.cl/api/health`
- Intervalo: 5 min
- Aviso por email a operación

---

## 8. Backups diarios

Hay [`deploy/scripts/backup-db.sh`](../deploy/scripts/backup-db.sh) listo
con rotación 30 días. Programar con cron:

**hPanel → Avanzado → Cron Jobs → "Crear nuevo cron job"**:
- Comando:
  ```
  /home/u530306321/donot-platform/current/deploy/scripts/backup-db.sh >> /home/u530306321/donot-platform/backup.log 2>&1
  ```
- Cuándo: diario a las 3 AM (`0 3 * * *`)

Hostinger también tiene **backups automáticos del plan** de toda la
cuenta (hPanel → Backups). Son backup adicional — no reemplazan al cron.

---

## 9. Configurar plataformas desde el admin

**Sin volver a tocar `.env`.** Entrar a `https://donot.cl/admin/config`:

- **SEO:** título, descripción, keywords, imagen OG (1200×630)
- **Analítica:** GTM ID, GA4 ID, Meta Pixel ID, Meta CAPI token, GSC verification
- **Negocio:** dirección + lat/lng (alimenta Schema.org Bakery)
- **Contacto:** email público, Instagram

---

## 10. Mercado Pago — webhook en producción

En el panel de MP → Notificaciones → Webhooks:

- URL: `https://donot.cl/api/webhook/mercadopago`
- Eventos: `payment.created`, `payment.updated`
- Activar firma y pegar el secret en `MP_WEBHOOK_SECRET` del `.env.production`

Después de cambiar `.env.production`:
```bash
ssh -p 65002 u530306321@147.79.93.218
cd ~/donot-platform/current
. ~/.nvm/nvm.sh && nvm use 20
pm2 reload ecosystem.config.js --update-env
```

---

## 11. Pruebas finales del equipo

Cada miembro hace 1 pedido real con tarjeta de prueba de MP y verifica:

- [ ] Email de confirmación llega
- [ ] `/pedido/<token>` muestra estado correcto
- [ ] Operador (Luigi) puede entrar a `/admin/cocina` y avanzar el pedido
- [ ] Email de "preparando" / "en camino" / "entregado" llega
- [ ] Stock baja en `/admin/sabores`
- [ ] Métrica del cupón se actualiza si se usó

---

## Checklist final pre-soft-launch

- [ ] `https://donot.cl` carga, SSL válido (Hostinger emite certificado)
- [ ] `https://donot.cl/api/health` devuelve 200
- [ ] UptimeRobot monitorea
- [ ] Cron de backup configurado
- [ ] Resend enviando correos reales
- [ ] Mercado Pago en producción cobrando
- [ ] GTM/GA4/Pixel cargados (verificar con Tag Assistant)
- [ ] Sitemap accesible: `https://donot.cl/sitemap.xml`
- [ ] Search Console verificado y sitemap subido
- [ ] DKIM/SPF/MX de `donot.cl` correctos en Resend

---

## Operación día a día

**Logs en vivo:**
```bash
ssh -p 65002 u530306321@147.79.93.218
. ~/.nvm/nvm.sh && nvm use 20
pm2 logs donot
```

**Deploy de un fix:** push a `main`. Listo.

**Rollback rápido:**
```bash
ssh -p 65002 u530306321@147.79.93.218
cd ~/donot-platform
ls releases/   # elegir la anterior
ln -sfn ~/donot-platform/releases/<release-anterior> current
. ~/.nvm/nvm.sh && nvm use 20
pm2 reload ecosystem.config.js --update-env
```

**BD por CLI:**
```bash
ssh -p 65002 u530306321@147.79.93.218
mariadb -h localhost -u u530306321_donot_app -p u530306321_donot_prod
```

**BD por phpMyAdmin:** hPanel → Bases de datos → "Administrar" → abre
con sesión iniciada.
