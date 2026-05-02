# DEPLOY.md — Cómo subir donot.cl a producción

> Esta guía te lleva de "VPS recién creado" a "donot.cl con SSL recibiendo
> pedidos". Asume Hostinger VPS KVM 2 con Ubuntu 24.04, dominio `donot.cl`
> con DNS gestionable y un repo en GitHub.

---

## 0. Antes de empezar — checklist

- [ ] VPS Ubuntu 24.04 creado en Hostinger con IP fija
- [ ] Llave SSH en tu máquina local con acceso root al VPS
- [ ] DNS de `donot.cl` accesible (Hostinger, Cloudflare, NIC.cl, etc.)
- [ ] Repo en GitHub con permisos para crear secrets
- [ ] Cuenta Resend con dominio `donot.cl` verificado (DKIM/SPF/MX)
- [ ] Credenciales **productivas** de Mercado Pago (no sandbox)

---

## 1. Provisionar el VPS (5–10 min)

Subes una vez el script de provisionamiento y lo corres.

```bash
# En tu local
scp deploy/scripts/provision-vps.sh root@TU.IP.DEL.VPS:/root/

# SSH al VPS
ssh root@TU.IP.DEL.VPS
chmod +x provision-vps.sh
sudo ./provision-vps.sh
```

El script imprime al final:
- La contraseña generada para el usuario `donot` de Postgres
- El `DATABASE_URL` listo para pegar en producción

**Anótalos.** Lo necesitas en el paso 3.

---

## 2. Subir tu llave de deploy

GitHub Actions necesita una llave SSH propia para conectarse al VPS.

```bash
# En tu local — generar par dedicado para CI
ssh-keygen -t ed25519 -C "github-actions-donot" -f ~/.ssh/donot_deploy -N ""

# Copiar la pública al VPS al usuario "donot"
ssh-copy-id -i ~/.ssh/donot_deploy.pub donot@TU.IP.DEL.VPS

# Probar
ssh -i ~/.ssh/donot_deploy donot@TU.IP.DEL.VPS "whoami"
# debe devolver: donot
```

Guarda el contenido completo de `~/.ssh/donot_deploy` (la **privada**)
para el paso 6.

---

## 3. Pegar las variables de entorno en el VPS

```bash
ssh donot@TU.IP.DEL.VPS
sudo nano /var/www/donot-platform/shared/.env.production
```

Pega el contenido de [`deploy/env.production.example`](../deploy/env.production.example)
y reemplaza:

| Variable | De dónde sacarla |
|---|---|
| `DATABASE_URL` | la que imprimió `provision-vps.sh` |
| `JWT_SECRET` | `openssl rand -base64 32` (corre en tu local) |
| `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` | panel de Mercado Pago → Producción |
| `MP_WEBHOOK_SECRET` | activa firma de webhooks en MP, pega el secret |
| `RESEND_API_KEY` | resend.com → API Keys, después de verificar dominio |

Permisos:
```bash
sudo chown donot:donot /var/www/donot-platform/shared/.env.production
sudo chmod 600         /var/www/donot-platform/shared/.env.production
```

---

## 4. Apuntar DNS de donot.cl al VPS

En tu panel DNS, crear:

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| A | `@` | `IP.DEL.VPS` | 300 |
| A | `www` | `IP.DEL.VPS` | 300 |

Esperar 5–30 min y verificar:
```bash
dig +short donot.cl
dig +short www.donot.cl
# ambos deben devolver la IP del VPS
```

---

## 5. NGINX + SSL Let's Encrypt

```bash
ssh root@TU.IP.DEL.VPS

# Subir el config de nginx (desde tu local en otra terminal):
# scp deploy/nginx/donot.cl.conf root@TU.IP.DEL.VPS:/etc/nginx/sites-available/donot.cl

sudo ln -s /etc/nginx/sites-available/donot.cl /etc/nginx/sites-enabled/donot.cl
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# SSL con certbot (después de que el DNS propague)
sudo certbot --nginx -d donot.cl -d www.donot.cl \
  --non-interactive --agree-tos -m andres@morgansmedia.cl --redirect

# Renovación automática (certbot ya instala el timer; verificar):
sudo systemctl list-timers | grep certbot
```

---

## 6. Configurar GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → **New repository secret**.

| Secret | Valor |
|---|---|
| `DEPLOY_HOST` | IP o `donot.cl` |
| `DEPLOY_USER` | `donot` |
| `DEPLOY_SSH_KEY` | contenido completo de `~/.ssh/donot_deploy` (privada) |

También crear un *Environment* `production` con required reviewers si quieres
gatear deploys manualmente.

---

## 7. Primer deploy

Push a `main` o **Run workflow** manualmente desde la pestaña Actions.

El workflow:
1. Hace `npm ci` + `prisma generate` + `npm run build`
2. Empaqueta `.next/standalone` + `static` + `public/` + `prisma/`
3. `rsync` al VPS a `/var/www/donot-platform/releases/<timestamp>-<sha>/`
4. Corre [`release.sh`](../deploy/scripts/release.sh) que:
   - Enlaza `.env.production` y `public/uploads/` desde `shared/`
   - Aplica `prisma migrate deploy`
   - Mueve el symlink `current/`
   - `pm2 reload`
5. Hace `curl https://donot.cl/api/health` y falla si no responde 200

---

## 8. Seed inicial (solo la primera vez)

Después del primer deploy exitoso, sembrar Droop 001 + admin OWNER:

```bash
ssh donot@TU.IP.DEL.VPS
cd /var/www/donot-platform/current
npx prisma db seed
```

Login admin: `https://donot.cl/admin/login`
- Email: el que dejaste en `ADMIN_INITIAL_EMAIL`
- Password: el de `ADMIN_INITIAL_PASSWORD` — **cambiarla apenas entres** desde `/admin/usuarios`

---

## 9. UptimeRobot

Crear monitor HTTP(S) en [uptimerobot.com](https://uptimerobot.com):
- URL: `https://donot.cl/api/health`
- Intervalo: 5 min
- Aviso por email a operación

---

## 10. Backups

Ya hay [`deploy/scripts/backup-db.sh`](../deploy/scripts/backup-db.sh)
que rota 30 días local en `/var/backups/donot/`.

```bash
ssh donot@TU.IP.DEL.VPS
crontab -e
# Sumar:
0 3 * * * /var/www/donot-platform/current/deploy/scripts/backup-db.sh >> /var/log/donot-backup.log 2>&1
```

Para sumar destino remoto (Backblaze B2 / S3): descomentar el bloque al
final del script y exportar `B2_BUCKET` y credenciales.

---

## 11. Configurar plataformas desde el admin

**Sin volver a tocar `.env`.** Entrar a `https://donot.cl/admin/config`:

- **SEO:** título, descripción, keywords, imagen OG (1200×630)
- **Analítica:** GTM ID, GA4 ID, Meta Pixel ID, Meta CAPI token, GSC verification
- **Negocio:** dirección + lat/lng (alimenta Schema.org Bakery)
- **Contacto:** email público, Instagram

---

## 12. Mercado Pago — webhook en producción

En el panel de MP → Notificaciones → Webhooks:

- URL: `https://donot.cl/api/webhook/mercadopago`
- Eventos: `payment.created`, `payment.updated`
- Activar firma y pegar el secret en `MP_WEBHOOK_SECRET` del `.env.production`

Reiniciar PM2 después de cambiar el `.env`:
```bash
ssh donot@TU.IP.DEL.VPS
cd /var/www/donot-platform/current
pm2 reload ecosystem.config.js --update-env
```

---

## 13. Pruebas finales del equipo

Cada miembro hace 1 pedido real con tarjeta de prueba de MP y verifica:

- [ ] Email de confirmación llega
- [ ] `/pedido/<token>` muestra estado correcto
- [ ] Operador (Luigi) puede entrar a `/admin/cocina` y avanzar el pedido
- [ ] Email de "preparando" / "en camino" / "entregado" llega
- [ ] Stock baja en `/admin/sabores`
- [ ] Métrica del cupón se actualiza si se usó

---

## Checklist final pre-soft-launch

- [ ] `https://donot.cl` carga, SSL válido, redirect 80→443
- [ ] `https://www.donot.cl` redirige a `https://donot.cl`
- [ ] `https://donot.cl/api/health` devuelve 200
- [ ] UptimeRobot monitorea
- [ ] Backups ejecutándose en cron
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
ssh donot@TU.IP.DEL.VPS
pm2 logs donot
```

**Deploy de un fix:** push a `main`. Listo.

**Rollback rápido:**
```bash
ssh donot@TU.IP.DEL.VPS
cd /var/www/donot-platform
ls releases/   # elegir la anterior
ln -sfn /var/www/donot-platform/releases/<release-anterior> current
pm2 reload ecosystem.config.js --update-env
```

**Acceder a la BD:**
```bash
ssh donot@TU.IP.DEL.VPS
psql -U donot -d donot_prod
```
