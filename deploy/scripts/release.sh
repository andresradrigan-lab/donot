#!/usr/bin/env bash
###
# release.sh — corre EN el servidor Hostinger, dentro del directorio de la
# nueva release que GitHub Actions acaba de subir. Hace migraciones,
# switchea el symlink y reinicia PM2.
#
# Estructura en el servidor:
#   ~/donot-platform/
#     ├── current     → symlink a la release activa
#     ├── releases/
#     │   ├── <sha1>/
#     │   ├── <sha2>/
#     │   └── ...
#     └── shared/
#         ├── .env.production
#         └── uploads/
#
# Lo invoca .github/workflows/deploy.yml después de rsync.
#
# La app de Node.js se registra desde hPanel apuntando a ~/donot-platform/current/
# con startup file `.next/standalone/server.js`. Hostinger se encarga del proxy
# y del SSL del dominio donot.cl.
###

set -euo pipefail

RELEASE_DIR="$1"
APP_ROOT="${HOME}/donot-platform"
SHARED_DIR="${APP_ROOT}/shared"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

# Cargar nvm para que `pm2`, `node`, `npx prisma` estén en PATH.
export NVM_DIR="${HOME}/.nvm"
# shellcheck disable=SC1091
[ -s "${NVM_DIR}/nvm.sh" ] && \. "${NVM_DIR}/nvm.sh"
nvm use 20 > /dev/null 2>&1 || true

cd "${RELEASE_DIR}"

echo "==> Linking shared assets…"
ln -sfn "${SHARED_DIR}/.env.production" "${RELEASE_DIR}/.env.production"
ln -sfn "${SHARED_DIR}/.env.production" "${RELEASE_DIR}/.env"
mkdir -p "${RELEASE_DIR}/public"
ln -sfn "${SHARED_DIR}/uploads" "${RELEASE_DIR}/public/uploads"

# Standalone necesita .next/static y public dentro de su directorio.
mkdir -p "${RELEASE_DIR}/.next/standalone/.next"
cp -r "${RELEASE_DIR}/.next/static" "${RELEASE_DIR}/.next/standalone/.next/static"
cp -r "${RELEASE_DIR}/public" "${RELEASE_DIR}/.next/standalone/public"
ln -sfn "${SHARED_DIR}/uploads" "${RELEASE_DIR}/.next/standalone/public/uploads"

echo "==> Aplicando migraciones (mariadb CLI, no Prisma engine)…"
# Prisma 6 con adapter mariadb funciona en runtime, pero `prisma migrate
# deploy` usa el query engine de Prisma que falla con MariaDB 11.x. Como
# workaround aplicamos las migraciones con el cliente nativo de MariaDB,
# llevando registro manual en la tabla _prisma_migrations.
cd "${RELEASE_DIR}"
bash "${RELEASE_DIR}/deploy/scripts/migrate-mariadb.sh"

# Standalone necesita node_modules para ejecutar Prisma client en runtime.
ln -sfn "${RELEASE_DIR}/node_modules" "${RELEASE_DIR}/.next/standalone/node_modules"

echo "==> Switching symlink…"
ln -sfn "${RELEASE_DIR}" "${APP_ROOT}/current"

echo "==> Reload Passenger (LiteSpeed Node) — touch restart.txt…"
PUBLIC_HTML="${HOME}/domains/donot.cl/public_html"
if [ -d "${PUBLIC_HTML}" ]; then
  mkdir -p "${PUBLIC_HTML}/tmp"
  touch "${PUBLIC_HTML}/tmp/restart.txt"
  echo "    Passenger marked for reload"
fi

# PM2 queda como fallback de monitoreo, pero Passenger es lo que sirve
# las requests del dominio. Si el process no está bajo PM2 ya, no lo
# arranca de cero (evita ocupar puertos en conflicto con Passenger).
if pm2 describe donot > /dev/null 2>&1; then
  echo "==> Reload PM2 (proceso existente)…"
  cd "${APP_ROOT}/current"
  pm2 reload ecosystem.config.js --update-env
  pm2 save > /dev/null
fi

echo "==> Limpiando releases viejas (manteniendo ${KEEP_RELEASES})…"
cd "${APP_ROOT}/releases"
# shellcheck disable=SC2012
ls -1t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo ""
echo "✅  Release activa: ${RELEASE_DIR}"
pm2 list 2>/dev/null | grep donot || true
