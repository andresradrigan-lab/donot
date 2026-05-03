# Bootstrap del deploy webhook (pull-based, tarball precompilado)

Esta es la receta para **arrancar de cero** después del cleanup en hPanel.
Diseñada para Hostinger Cloud Hosting con LVE limit de procesos.

## Por qué esta arquitectura

- **GitHub Actions hace TODO el trabajo pesado** (npm install, prisma
  generate, build standalone, prune, tar.gz). El runner es ilimitado.
- **El servidor solo descomprime y reinicia** (~5-10 procesos por ~30s).
- **Sin SSH desde GitHub Actions**: el server inicia la conexión vía
  webhook HTTP. Si Hostinger te bloquea SSH, el deploy igual funciona.
- **Rollback automático** si la nueva release no levanta en 60s.

## Pre-requisitos en hPanel (sin SSH)

1. **Dominio `donot.cl`** agregado (Dominios → Add)
2. **BD MySQL** creada:
   - Nombre: `donot_prod` → queda `u530306321_donot_prod`
   - Usuario: `donot_app` → queda `u530306321_donot_app`
   - Pass: anotala
3. **Aplicación Node.js** creada (Avanzado → Aplicaciones Node.js):
   - Versión Node: **20.x**
   - Modo: **Production**
   - Application root: **`domains/donot.cl/public_html`**
   - Application URL: **`donot.cl`**
   - Startup file: **`server.js`**
   - Estado: **Running** (con un `app.js` placeholder por ahora)

## Bootstrap (1 sola sesión SSH, ~3 min)

Cuando el LVE de procesos esté tranquilo, abrí SSH desde tu Mac:

```bash
ssh -p 65002 u530306321@147.79.93.218
```

Pegá este bloque completo:

```bash
set -e

mkdir -p ~/donot-platform/{shared,releases}
mkdir -p ~/donot-platform/shared/uploads

DEPLOY_SECRET=$(openssl rand -hex 32)
JWT=$(openssl rand -base64 32)

cat > ~/donot-platform/shared/.env.production << ENVEOF
APP_URL=https://donot.cl
NODE_ENV=production

DATABASE_URL=mysql://u530306321_donot_app:CAMBIAR_PASS@localhost:3306/u530306321_donot_prod

JWT_SECRET=${JWT}
ADMIN_INITIAL_EMAIL=andresradrigan@morgansmedia.cl
ADMIN_INITIAL_PASSWORD=changeme_in_first_login

MP_ACCESS_TOKEN=APP_USR-611270231670698-050211-724279cf9db3663cd52f890cbd316243-2667206462
MP_PUBLIC_KEY=APP_USR-7773b455-2edf-4e71-bbf0-9f8f43c0f66a
MP_WEBHOOK_SECRET=

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=hola@donot.cl
SMTP_PASS=
SMTP_FROM_EMAIL=hola@donot.cl
SMTP_FROM_NAME=donot.

CLOUDINARY_URL=

DEFAULT_FREE_SHIPPING_THRESHOLD_CLP=50000
DEFAULT_FREE_SHIPPING_MIN_BOXES=3
ORDER_NUMBER_PREFIX=DN

DEPLOY_HOOK_SECRET=${DEPLOY_SECRET}
ENVEOF

chmod 600 ~/donot-platform/shared/.env.production

cat > ~/donot-platform/deploy.sh << 'EOF'
#!/usr/bin/env bash
exec bash ~/donot-platform/current/deploy/scripts/local-deploy.sh "$@"
EOF
chmod +x ~/donot-platform/deploy.sh

echo ""
echo "=========================================="
echo "DEPLOY_HOOK_SECRET (anotalo para GitHub):"
echo "${DEPLOY_SECRET}"
echo "=========================================="
echo ""
echo "AHORA editá el .env y reemplazá CAMBIAR_PASS:"
echo "  nano ~/donot-platform/shared/.env.production"
```

**Anotá el `DEPLOY_HOOK_SECRET` que imprime al final** (lo pegás en GitHub).

Editá el `.env` con `nano` y reemplazá `CAMBIAR_PASS` por la pass real
de la BD MySQL.

## Configurar GitHub

En https://github.com/andresradrigan-lab/donot/settings:

**Secrets and variables → Actions → Secrets:**
- `DEPLOY_HOOK_URL` = `https://donot.cl/api/deploy-hook`
- `DEPLOY_HOOK_SECRET` = el secret del bootstrap

**Secrets and variables → Actions → Variables:**
- `DEPLOY_MODE` = `webhook`

## Primer deploy (manual desde el server)

El primer deploy hay que hacerlo a mano porque el endpoint
`/api/deploy-hook` aún no existe en el server (depende del primer
build estar desplegado). Después de eso, todo es automático.

Push un commit dummy para que GitHub Actions cree el primer release:

```bash
# Desde tu Mac:
cd ~/Downloads/donot-platform
git commit --allow-empty -m "trigger: primer release"
git push
```

GitHub Actions builda, empaqueta y crea el GitHub Release con el
tarball. Cuando termine (~3 min), volvés al SSH del server:

```bash
ssh -p 65002 u530306321@147.79.93.218
```

Y descargás manualmente el último release:

```bash
TAG=$(curl -s https://api.github.com/repos/andresradrigan-lab/donot/releases/latest | grep tag_name | head -1 | cut -d '"' -f 4)
REL="${TAG#deploy-}"
URL="https://github.com/andresradrigan-lab/donot/releases/download/${TAG}/${REL}.tar.gz"
echo "Descargando ${URL}"

# Setup mínimo del primer release: descargar tarball, extraer en releases/
mkdir -p ~/donot-platform/releases/${REL}
curl -sL "${URL}" -o /tmp/donot-${REL}.tar.gz
tar -xzf /tmp/donot-${REL}.tar.gz -C ~/donot-platform/releases/${REL}/
rm /tmp/donot-${REL}.tar.gz

# Activar la release como "current" y correr el script de deploy completo
ln -sfn ~/donot-platform/releases/${REL} ~/donot-platform/current
bash ~/donot-platform/deploy.sh "${URL}" "${REL}"
```

Si todo va bien:
- Migraciones aplicadas en MariaDB
- Symlinks en `domains/donot.cl/public_html/` apuntando al release
- Passenger reinicia y sirve la app
- Health check `https://donot.cl/api/health` debe responder 200

## Cómo deployar después

**Automático:** push a `main` → GitHub Actions builda + crea Release +
POST al webhook → server descomprime + restart Passenger. ~3 min total.

**Manual (forzar redeploy del último):**

```bash
ssh -p 65002 u530306321@147.79.93.218
TAG=$(curl -s https://api.github.com/repos/andresradrigan-lab/donot/releases/latest | grep tag_name | head -1 | cut -d '"' -f 4)
REL="${TAG#deploy-}"
URL="https://github.com/andresradrigan-lab/donot/releases/download/${TAG}/${REL}.tar.gz"
bash ~/donot-platform/deploy.sh "${URL}" "${REL}"
```

**Sin SSH (desde tu Mac), por curl directo al webhook:**

```bash
SECRET="el-deploy-hook-secret"
TAG=$(curl -s https://api.github.com/repos/andresradrigan-lab/donot/releases/latest | grep tag_name | head -1 | cut -d '"' -f 4)
REL="${TAG#deploy-}"
URL="https://github.com/andresradrigan-lab/donot/releases/download/${TAG}/${REL}.tar.gz"
BODY=$(printf '{"tarballUrl":"%s","releaseId":"%s","tag":"%s"}' "$URL" "$REL" "$TAG")
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')

curl -X POST https://donot.cl/api/deploy-hook \
  -H "Content-Type: application/json" \
  -H "X-Deploy-Signature: $SIG" \
  --data "$BODY"
```

## Rollback

Si el deploy nuevo falla, `local-deploy.sh` revierte automáticamente al
release anterior y restablece los symlinks. No hay que hacer nada.

Si hay que volver atrás varios releases:

```bash
ssh -p 65002 u530306321@147.79.93.218
ls -1t ~/donot-platform/releases/
# elegí la versión anterior
PREV="20260503xxxx-xxxxxxx"
ln -sfn ~/donot-platform/releases/${PREV} ~/donot-platform/current
cd ~/domains/donot.cl/public_html
ln -sfn ~/donot-platform/current/server.js server.js
ln -sfn ~/donot-platform/current/.next .next
ln -sfn ~/donot-platform/current/.next/standalone/node_modules node_modules
ln -sfn ~/donot-platform/current/.next/standalone/public public
touch tmp/restart.txt
```

## Consumo de procesos por deploy

| Paso | Procesos pico | Duración |
|---|---|---|
| `curl` descarga tarball | 1 | ~5 s |
| `tar -xzf` extrae | 1 | ~3 s |
| `mariadb` migraciones | 2-3 | ~2 s |
| `ln -sfn` symlinks | 5×1 | < 1 s |
| `touch restart.txt` | 1 | < 1 s |
| Passenger arranca app | 1-3 | ~5 s |
| Health check `curl` | 1 | ~10-60 s |
| **Total simultáneo** | **~10** | **~30-60 s** |

Lejos del límite de 200 procesos. Sustainable para deploys frecuentes.
