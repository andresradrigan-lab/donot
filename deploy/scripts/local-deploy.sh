#!/usr/bin/env bash
###
# local-deploy.sh — corre EN el servidor Hostinger para hacer pull-based
# deploy: trae el último código de GitHub, instala deps, builda y reinicia
# Passenger.
#
# Lo invoca /api/deploy-hook (Webhook desde GitHub Actions) o tú a mano:
#   bash ~/donot-platform/deploy.sh origin/main <sha>
#
# La app principal vive en ~/donot-platform/repo (clonada de GitHub).
# El symlink ~/donot-platform/current apunta al repo (no a un release/
# como el flujo viejo de releases con timestamp).
###

set -euo pipefail

REF="${1:-origin/main}"
COMMIT="${2:-}"

APP_ROOT="${HOME}/donot-platform"
REPO_DIR="${APP_ROOT}/repo"
SHARED_DIR="${APP_ROOT}/shared"
PUBLIC_HTML="${HOME}/domains/donot.cl/public_html"
LOG_FILE="${APP_ROOT}/deploy.log"

log() { echo "[$(date -Iseconds)] $*" | tee -a "${LOG_FILE}" ; }

log "==> Deploy iniciado: ref=${REF} commit=${COMMIT}"

# Cargar nvm para tener node/npm disponibles.
export NVM_DIR="${HOME}/.nvm"
# shellcheck disable=SC1091
[ -s "${NVM_DIR}/nvm.sh" ] && \. "${NVM_DIR}/nvm.sh"
nvm use 20 > /dev/null 2>&1 || true

# Garantizar repo clonado.
if [ ! -d "${REPO_DIR}/.git" ]; then
  log "==> Repo no existe, clonando…"
  mkdir -p "${APP_ROOT}"
  git clone https://github.com/andresradrigan-lab/donot.git "${REPO_DIR}"
fi

cd "${REPO_DIR}"
PREV_HEAD="$(git rev-parse HEAD 2>/dev/null || echo none)"
log "    HEAD anterior: ${PREV_HEAD}"

# Fetch + checkout del ref pedido.
log "==> git fetch + checkout ${REF}"
git fetch origin --quiet
if [ -n "${COMMIT}" ]; then
  git checkout --detach "${COMMIT}" 2>&1 | tee -a "${LOG_FILE}" || git checkout --detach "${REF}" 2>&1 | tee -a "${LOG_FILE}"
else
  # ref es algo como "origin/main"
  git checkout --detach "${REF}" 2>&1 | tee -a "${LOG_FILE}"
fi

NEW_HEAD="$(git rev-parse HEAD)"
log "    HEAD nuevo: ${NEW_HEAD}"

if [ "${PREV_HEAD}" = "${NEW_HEAD}" ]; then
  log "==> Sin cambios, salgo"
  exit 0
fi

# Linkear .env productivo y uploads desde shared.
log "==> Vincular .env y uploads de shared/"
ln -sfn "${SHARED_DIR}/.env.production" "${REPO_DIR}/.env"
ln -sfn "${SHARED_DIR}/.env.production" "${REPO_DIR}/.env.production"
mkdir -p "${REPO_DIR}/public"
ln -sfn "${SHARED_DIR}/uploads" "${REPO_DIR}/public/uploads"

# Instalar deps.
log "==> npm ci --omit=dev"
npm ci --omit=dev --no-audit --no-fund 2>&1 | tee -a "${LOG_FILE}"

# Generar Prisma client.
log "==> prisma generate"
node_modules/.bin/prisma generate 2>&1 | tee -a "${LOG_FILE}" || true

# Build.
log "==> npm run build"
DATABASE_URL="$(/usr/bin/grep -E '^DATABASE_URL=' "${SHARED_DIR}/.env.production" | cut -d= -f2-)" \
  npm run build 2>&1 | tee -a "${LOG_FILE}"

# Standalone necesita .next/static y public adentro.
log "==> Preparar .next/standalone"
cp -r "${REPO_DIR}/.next/static" "${REPO_DIR}/.next/standalone/.next/static"
cp -r "${REPO_DIR}/public" "${REPO_DIR}/.next/standalone/public"
ln -sfn "${SHARED_DIR}/uploads" "${REPO_DIR}/.next/standalone/public/uploads"
# Symlink a node_modules para que Prisma client encuentre engines.
ln -sfn "${REPO_DIR}/node_modules" "${REPO_DIR}/.next/standalone/node_modules"

# Aplicar migraciones (mariadb CLI workaround para MariaDB 11).
log "==> Aplicar migraciones"
bash "${REPO_DIR}/deploy/scripts/migrate-mariadb.sh" 2>&1 | tee -a "${LOG_FILE}"

# Mover el symlink current al repo (público_html sigue apuntando a current/.next/standalone).
log "==> Activar symlink current → repo"
ln -sfn "${REPO_DIR}" "${APP_ROOT}/current"

# Asegurar el wrapper server.js, .htaccess y links de public_html.
log "==> Actualizar wrapper en public_html"
mkdir -p "${PUBLIC_HTML}/tmp"
cat > "${PUBLIC_HTML}/server.js" << 'WRAPPER'
const fs = require('fs')
const path = require('path')

const envFile = path.join(__dirname, '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const m = t.match(/^([A-Z0-9_]+)=(.*)$/i)
    if (!m) continue
    let [, k, v] = m
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[k]) process.env[k] = v
  }
}
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
require(path.join(process.env.HOME, 'donot-platform/current/.next/standalone/server.js'))
WRAPPER

cat > "${PUBLIC_HTML}/.htaccess" << HTACCESS
PassengerAppRoot ${PUBLIC_HTML}
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs20/root/bin/node
PassengerStartupFile server.js
PassengerBaseURI /
PassengerAppEnv production
HTACCESS

ln -sfn "${SHARED_DIR}/.env.production" "${PUBLIC_HTML}/.env"
ln -sfn "${REPO_DIR}/.next/standalone/node_modules" "${PUBLIC_HTML}/node_modules"
ln -sfn "${REPO_DIR}/.next/standalone/.next" "${PUBLIC_HTML}/.next"
ln -sfn "${REPO_DIR}/.next/standalone/public" "${PUBLIC_HTML}/public"
test -f "${PUBLIC_HTML}/package.json" || cat > "${PUBLIC_HTML}/package.json" << 'PKG'
{ "name": "donot-cl", "version": "0.1.0", "private": true, "main": "server.js" }
PKG

# Reiniciar Passenger.
log "==> Reload Passenger"
touch "${PUBLIC_HTML}/tmp/restart.txt"

# Health check con rollback en caso de falla.
log "==> Health check (max 60s)…"
ok=0
for i in $(seq 1 12); do
  sleep 5
  status=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" -H "Host: donot.cl" http://localhost/api/health 2>/dev/null || echo 000)
  if [ "${status}" = "200" ]; then
    log "    ✓ health OK al intento ${i}"
    ok=1
    break
  fi
done

if [ "${ok}" -eq 0 ]; then
  log "    ✗ Health FAIL — rollback a ${PREV_HEAD}"
  if [ "${PREV_HEAD}" != "none" ]; then
    git checkout --detach "${PREV_HEAD}" 2>&1 | tee -a "${LOG_FILE}"
    npm ci --omit=dev --no-audit --no-fund 2>&1 | tee -a "${LOG_FILE}"
    DATABASE_URL="$(/usr/bin/grep -E '^DATABASE_URL=' "${SHARED_DIR}/.env.production" | cut -d= -f2-)" \
      npm run build 2>&1 | tee -a "${LOG_FILE}" || true
    cp -r "${REPO_DIR}/.next/static" "${REPO_DIR}/.next/standalone/.next/static" 2>/dev/null || true
    cp -r "${REPO_DIR}/public" "${REPO_DIR}/.next/standalone/public" 2>/dev/null || true
    ln -sfn "${REPO_DIR}/node_modules" "${REPO_DIR}/.next/standalone/node_modules"
    touch "${PUBLIC_HTML}/tmp/restart.txt"
    log "    rollback aplicado"
  fi
  exit 1
fi

log "==> Deploy OK ${PREV_HEAD} → ${NEW_HEAD}"
