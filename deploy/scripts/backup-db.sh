#!/usr/bin/env bash
###
# backup-db.sh — mysqldump diario de la BD MariaDB de Hostinger.
# Guarda en ~/donot-platform/backups/ con rotación de 30 días.
#
# Cron sugerido (en hPanel → Avanzado → Cron Jobs):
#   0 3 * * * /home/u530306321/donot-platform/current/deploy/scripts/backup-db.sh
###

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-${HOME}/donot-platform/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
SHARED_ENV="${HOME}/donot-platform/shared/.env.production"

if [ ! -f "${SHARED_ENV}" ]; then
  echo "[$(date -Iseconds)] ERROR: no se encontró ${SHARED_ENV}"
  exit 1
fi

# Cargar DATABASE_URL del .env.production.
set -a
# shellcheck disable=SC1090
. "${SHARED_ENV}"
set +a

# Parsear DATABASE_URL=mysql://USER:PASS@HOST:PORT/DBNAME
URL="${DATABASE_URL#mysql://}"
DB_USER="${URL%%:*}"
URL="${URL#*:}"
DB_PASS="${URL%%@*}"
URL="${URL#*@}"
HOST_PART="${URL%%/*}"
DB_HOST="${HOST_PART%%:*}"
DB_PORT="${HOST_PART#*:}"
[ "${DB_PORT}" = "${HOST_PART}" ] && DB_PORT=3306
DB_NAME="${URL##*/}"

mkdir -p "${BACKUP_DIR}"

stamp="$(date +%Y%m%d-%H%M%S)"
out="${BACKUP_DIR}/${DB_NAME}-${stamp}.sql.gz"

echo "[$(date -Iseconds)] Backup ${DB_NAME} → ${out}"
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --no-tablespaces \
  "${DB_NAME}" \
  | gzip > "${out}"

find "${BACKUP_DIR}" -type f -name "${DB_NAME}-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

size=$(du -h "${out}" | cut -f1)
echo "[$(date -Iseconds)] Backup OK (${size})"
