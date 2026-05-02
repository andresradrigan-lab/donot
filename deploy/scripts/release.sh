#!/usr/bin/env bash
###
# release.sh — corre EN EL VPS, dentro del directorio de la nueva release
# que GitHub Actions acaba de subir. Hace migraciones, switchea el symlink
# y reinicia PM2.
#
# Estructura asumida en VPS:
#   /var/www/donot-platform/
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
###

set -euo pipefail

RELEASE_DIR="$1"
APP_ROOT="/var/www/donot-platform"
SHARED_DIR="${APP_ROOT}/shared"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

cd "${RELEASE_DIR}"

echo "==> Linking shared assets…"
ln -sfn "${SHARED_DIR}/.env.production" "${RELEASE_DIR}/.env.production"
ln -sfn "${SHARED_DIR}/.env.production" "${RELEASE_DIR}/.env"
mkdir -p "${RELEASE_DIR}/public"
ln -sfn "${SHARED_DIR}/uploads" "${RELEASE_DIR}/public/uploads"

# Standalone necesita ver public y .next/static dentro de su directorio.
mkdir -p "${RELEASE_DIR}/.next/standalone/.next"
cp -r "${RELEASE_DIR}/.next/static" "${RELEASE_DIR}/.next/standalone/.next/static"
cp -r "${RELEASE_DIR}/public" "${RELEASE_DIR}/.next/standalone/public"
ln -sfn "${SHARED_DIR}/uploads" "${RELEASE_DIR}/.next/standalone/public/uploads"

echo "==> Aplicando migraciones de Prisma…"
cd "${RELEASE_DIR}"
# El runtime ya genera el client en build; aquí solo migrate deploy.
DATABASE_URL="$(grep -E '^DATABASE_URL=' "${SHARED_DIR}/.env.production" | cut -d= -f2-)" \
  npx prisma migrate deploy

echo "==> Switching symlink…"
ln -sfn "${RELEASE_DIR}" "${APP_ROOT}/current"

echo "==> Reload PM2…"
cd "${APP_ROOT}/current"
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save

echo "==> Limpiando releases viejas (manteniendo ${KEEP_RELEASES})…"
cd "${APP_ROOT}/releases"
ls -1t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo ""
echo "✅  Release activa: ${RELEASE_DIR}"
pm2 list | grep donot || true
