#!/usr/bin/env bash
###
# migrate-mariadb.sh — aplica las migraciones de Prisma usando el cliente
# nativo de MariaDB.
#
# Usamos esto en producción (Hostinger Cloud, MariaDB 11.x) porque el
# query engine de Prisma falla con auth contra MariaDB 11+, mientras que
# el cliente nativo (`mariadb` CLI) y el driver `mariadb` de Node sí
# conectan correctamente.
#
# El script:
# 1. Garantiza que la tabla _prisma_migrations existe (compatible con
#    el formato que usa Prisma).
# 2. Por cada carpeta en prisma/migrations/, si la migración no está
#    aplicada según _prisma_migrations, ejecuta migration.sql y la
#    registra.
###

set -euo pipefail

SHARED_ENV="${HOME}/donot-platform/shared/.env.production"
if [ ! -f "${SHARED_ENV}" ]; then
  echo "ERROR: no encontré ${SHARED_ENV}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "${SHARED_ENV}"
set +a

# Parsear DATABASE_URL=mysql://USER:PASS@HOST:PORT/DBNAME
URL="${DATABASE_URL#mysql://}"
DB_USER_ENC="${URL%%:*}"
URL="${URL#*:}"
DB_PASS_ENC="${URL%%@*}"
URL="${URL#*@}"
HOST_PART="${URL%%/*}"
DB_HOST="${HOST_PART%%:*}"
DB_PORT="${HOST_PART#*:}"
[ "${DB_PORT}" = "${HOST_PART}" ] && DB_PORT=3306
DB_NAME="${URL%%\?*}"
DB_NAME="${DB_NAME##*/}"

# URL-decode user y pass
urldecode() { printf '%b' "${1//%/\\x}"; }
DB_USER="$(urldecode "${DB_USER_ENC}")"
DB_PASS="$(urldecode "${DB_PASS_ENC}")"

# Si el host es "localhost" usamos socket Unix (más rápido y evita el
# resolve a ::1 que rompe en Hostinger). Si es cualquier otro host,
# pasamos -h/-P para forzar TCP.
mariadb_args=()
if [ "${DB_HOST}" = "localhost" ] || [ "${DB_HOST}" = "127.0.0.1" ]; then
  mariadb_args=()
else
  mariadb_args=(-h "${DB_HOST}" -P "${DB_PORT}")
fi
mariadb_args+=(-u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}")

run_sql() {
  mariadb "${mariadb_args[@]}" "$@"
}

run_sql_file() {
  mariadb "${mariadb_args[@]}" < "$1"
}

echo "  Conectando a ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Crear _prisma_migrations si no existe.
run_sql -e "
CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id                       VARCHAR(36) NOT NULL,
  checksum                 VARCHAR(64) NOT NULL,
  finished_at              DATETIME(3) NULL,
  migration_name           VARCHAR(255) NOT NULL,
  logs                     TEXT NULL,
  rolled_back_at           DATETIME(3) NULL,
  started_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  applied_steps_count      INTEGER UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

MIGRATIONS_DIR="prisma/migrations"
applied=0
skipped=0

for dir in "${MIGRATIONS_DIR}"/*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"
  sql="${dir}migration.sql"
  [ -f "$sql" ] || continue

  # ¿Ya aplicada?
  count=$(run_sql -N -B -e "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='${name}' AND finished_at IS NOT NULL;")
  if [ "$count" -gt 0 ]; then
    echo "  ✓ ya aplicada: ${name}"
    skipped=$((skipped + 1))
    continue
  fi

  echo "  → aplicando: ${name}"
  if command -v sha256sum >/dev/null 2>&1; then
    checksum=$(sha256sum "$sql" | awk '{print $1}')
  else
    checksum=$(shasum -a 256 "$sql" | awk '{print $1}')
  fi
  if [ -r /proc/sys/kernel/random/uuid ]; then
    uuid=$(cat /proc/sys/kernel/random/uuid)
  else
    uuid=$(uuidgen | tr 'A-Z' 'a-z')
  fi

  run_sql -e "
    INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count)
    VALUES ('${uuid}', '${checksum}', '${name}', NOW(3), 0);
  "

  if run_sql_file "$sql"; then
    run_sql -e "
      UPDATE _prisma_migrations
      SET finished_at = NOW(3), applied_steps_count = 1
      WHERE id = '${uuid}';
    "
    applied=$((applied + 1))
    echo "    ✓ ok"
  else
    err=$?
    run_sql -e "
      UPDATE _prisma_migrations
      SET logs = 'migration failed', rolled_back_at = NOW(3)
      WHERE id = '${uuid}';
    "
    echo "    ✗ falló (exit ${err})"
    exit "$err"
  fi
done

echo "  resumen: ${applied} aplicadas, ${skipped} ya estaban"
