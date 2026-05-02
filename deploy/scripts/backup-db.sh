#!/usr/bin/env bash
###
# backup-db.sh — pg_dump diario de donot_prod, guardado local con
# rotación de 30 días. Después se puede sumar sync a Backblaze B2 / S3.
#
# Cron sugerido (corre como usuario "donot" o como postgres):
#   0 3 * * * /var/www/donot-platform/current/deploy/scripts/backup-db.sh
###

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/donot}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_NAME="${DB_NAME:-donot_prod}"
DB_USER="${DB_USER:-donot}"

mkdir -p "${BACKUP_DIR}"

stamp="$(date +%Y%m%d-%H%M%S)"
out="${BACKUP_DIR}/${DB_NAME}-${stamp}.sql.gz"

echo "[$(date -Iseconds)] Backup → ${out}"
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  --host="${PGHOST:-localhost}" \
  --port="${PGPORT:-5432}" \
  --username="${DB_USER}" \
  --no-password \
  --format=plain \
  --no-owner \
  "${DB_NAME}" \
  | gzip > "${out}"

# Rotación
find "${BACKUP_DIR}" -type f -name "${DB_NAME}-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date -Iseconds)] Backup OK ($(du -h "${out}" | cut -f1))"

# Hook opcional para sync a almacenamiento remoto (Backblaze B2, S3, etc.).
# if [ -n "${B2_BUCKET:-}" ]; then
#   b2 upload-file "${B2_BUCKET}" "${out}" "$(basename "${out}")"
# fi
