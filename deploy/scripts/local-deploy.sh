#!/usr/bin/env bash
###
# local-deploy.sh — descarga un tarball precompilado de GitHub Release
# y lo activa en el servidor de Hostinger Cloud.
#
# Lo invoca /api/deploy-hook con el JSON { tarballUrl, releaseId }.
# También puede correrse manualmente:
#   bash ~/donot-platform/deploy.sh <tarballUrl> <releaseId>
#
# Diseñado para consumir POCOS procesos (~5-7) en pocos segundos:
# no corre npm install, no compila, no spawnnea Prisma engines.
# Todo el trabajo pesado sucede en GitHub Actions; el server solo
# extrae el tar.gz y mueve symlinks.
#
# Estructura en el servidor:
#   ~/donot-platform/
#     ├── current     → symlink a la release activa
#     ├── releases/<id>/
#     └── shared/
#         ├── .env.production
#         └── uploads/
#
#   ~/domains/donot.cl/public_html/   ← app Node registrada en hPanel
#     ├── server.js     → ~/donot-platform/current/server.js
#     ├── .next         → ~/donot-platform/current/.next
#     ├── node_modules  → ~/donot-platform/current/.next/standalone/node_modules
#     ├── public        → ~/donot-platform/current/.next/standalone/public
#     ├── .env          → ~/donot-platform/shared/.env.production
#     ├── package.json  (mínimo, no se reemplaza por deploy)
#     └── tmp/restart.txt
###

set -euo pipefail

TARBALL_URL="${1:?Falta tarballUrl}"
RELEASE_ID="${2:?Falta releaseId}"

APP_ROOT="${HOME}/donot-platform"
SHARED_DIR="${APP_ROOT}/shared"
RELEASES_DIR="${APP_ROOT}/releases"
PUBLIC_HTML="${HOME}/domains/donot.cl/public_html"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
LOG_FILE="${APP_ROOT}/deploy.log"
KEEP_RELEASES=3

log() { echo "[$(date -Iseconds)] $*" | tee -a "${LOG_FILE}" ; }

log "==> Deploy iniciado: ${RELEASE_ID}"

mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}/uploads"

# 1. Descargar tarball
log "==> Descargando ${TARBALL_URL}"
TMPFILE="/tmp/donot-${RELEASE_ID}.tar.gz"
curl -sL --fail "${TARBALL_URL}" -o "${TMPFILE}"
test -s "${TMPFILE}" || { log "✗ tarball vacío o no descargó"; exit 1; }

# 2. Extraer
log "==> Extrayendo en ${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"
tar -xzf "${TMPFILE}" -C "${RELEASE_DIR}/"
rm -f "${TMPFILE}"

# 3. Linkear .env y uploads dentro de la release
log "==> Linkeando shared/"
ln -sfn "${SHARED_DIR}/.env.production" "${RELEASE_DIR}/.env"
mkdir -p "${RELEASE_DIR}/.next/standalone/public"
ln -sfn "${SHARED_DIR}/uploads" "${RELEASE_DIR}/.next/standalone/public/uploads"

# 4. Aplicar migraciones (mariadb CLI, ~3 procesos por unos segundos)
log "==> Aplicando migraciones"
bash "${RELEASE_DIR}/deploy/scripts/migrate-mariadb.sh" 2>&1 | tee -a "${LOG_FILE}"

# 5. Activar (mover symlinks)
log "==> Activando release"
PREV=$(readlink "${APP_ROOT}/current" 2>/dev/null || echo none)
log "    PREV: ${PREV}"
log "    NEW : ${RELEASE_DIR}"

ln -sfn "${RELEASE_DIR}" "${APP_ROOT}/current"

# Symlinks dentro de public_html.
mkdir -p "${PUBLIC_HTML}/tmp"
cd "${PUBLIC_HTML}"
ln -sfn "${RELEASE_DIR}/server.js" server.js
ln -sfn "${RELEASE_DIR}/.next" .next
ln -sfn "${RELEASE_DIR}/.next/standalone/node_modules" node_modules
ln -sfn "${RELEASE_DIR}/.next/standalone/public" public
ln -sfn "${SHARED_DIR}/.env.production" .env

# package.json mínimo si no existe (Passenger lo necesita).
if [ ! -f package.json ] || [ -L package.json ]; then
  rm -f package.json
  cat > package.json << 'PKG'
{
  "name": "donot-cl",
  "version": "0.1.0",
  "private": true,
  "main": "server.js"
}
PKG
fi

# 6. Reiniciar Passenger
log "==> Reload Passenger"
touch "${PUBLIC_HTML}/tmp/restart.txt"

# 7. Health check con rollback automático
log "==> Health check (max 60s)"
ok=0
for i in $(seq 1 12); do
  sleep 5
  status=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" -H "Host: donot.cl" http://localhost/api/health 2>/dev/null || echo 000)
  if [ "${status}" = "200" ]; then
    log "    ✓ health OK al intento ${i} (${status})"
    ok=1
    break
  fi
done

if [ "${ok}" -eq 0 ]; then
  log "    ✗ Health FAIL — rollback a ${PREV}"
  if [ "${PREV}" != "none" ] && [ -d "${PREV}" ]; then
    ln -sfn "${PREV}" "${APP_ROOT}/current"
    cd "${PUBLIC_HTML}"
    ln -sfn "${PREV}/server.js" server.js
    ln -sfn "${PREV}/.next" .next
    ln -sfn "${PREV}/.next/standalone/node_modules" node_modules
    ln -sfn "${PREV}/.next/standalone/public" public
    touch "${PUBLIC_HTML}/tmp/restart.txt"
    log "    rollback aplicado"
  fi
  exit 1
fi

# 8. Limpiar releases viejas (mantener últimas N)
log "==> Limpiando releases viejas (manteniendo ${KEEP_RELEASES})"
cd "${RELEASES_DIR}"
# shellcheck disable=SC2012
ls -1t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

log "==> Deploy OK ${PREV} → ${RELEASE_DIR}"
