#!/usr/bin/env bash
###
# provision-vps.sh — instalación inicial de un VPS Ubuntu 24.04 limpio.
#
# Cosas que deja listo:
#   - Node 20.x, npm, PM2 global
#   - PostgreSQL 16 con usuario donot y BD donot_prod
#   - NGINX + Certbot (preparado para SSL Let's Encrypt)
#   - UFW (firewall) abriendo 22/80/443
#   - Carpeta /var/www/donot-platform/ con permisos correctos
#   - Usuario "donot" (sin shell) para que PM2 corra como ese usuario
#
# Cómo correrlo (UNA vez, después de crear el VPS y configurar SSH key):
#   ssh root@TU.IP.DEL.VPS
#   curl -O https://raw.githubusercontent.com/<owner>/<repo>/main/deploy/scripts/provision-vps.sh
#   chmod +x provision-vps.sh
#   sudo ./provision-vps.sh
###

set -euo pipefail

DEPLOY_USER="donot"
APP_DIR="/var/www/donot-platform"
DB_NAME="donot_prod"
DB_USER="donot"
DB_PASS="$(openssl rand -base64 24 | tr -d '+/=' | cut -c1-24)"

echo "==> Actualizando paquetes…"
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Instalando dependencias base…"
apt-get install -y -qq \
  curl ca-certificates gnupg \
  build-essential \
  git \
  ufw \
  nginx \
  certbot python3-certbot-nginx \
  postgresql-16 postgresql-contrib \
  rsync

echo "==> Instalando Node 20 (NodeSource)…"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

echo "==> Instalando PM2 global…"
npm install -g pm2

echo "==> Creando usuario de deploy: ${DEPLOY_USER}"
if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
fi
mkdir -p /home/${DEPLOY_USER}/.ssh
chown -R ${DEPLOY_USER}:${DEPLOY_USER} /home/${DEPLOY_USER}/.ssh
chmod 700 /home/${DEPLOY_USER}/.ssh

echo "==> Creando carpeta de la app…"
mkdir -p "${APP_DIR}/releases" "${APP_DIR}/shared" "${APP_DIR}/shared/uploads"
chown -R ${DEPLOY_USER}:${DEPLOY_USER} "${APP_DIR}"

echo "==> Configurando Postgres…"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename = '${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"

echo "==> Configurando UFW (firewall)…"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Habilitando NGINX…"
systemctl enable --now nginx

echo "==> Configurando PM2 startup como ${DEPLOY_USER}…"
sudo -u ${DEPLOY_USER} bash -c "pm2 startup systemd -u ${DEPLOY_USER} --hp /home/${DEPLOY_USER}" || true
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${DEPLOY_USER} --hp /home/${DEPLOY_USER} | tail -1 | sh || true

echo ""
echo "============================================================"
echo "  VPS provisionado."
echo "============================================================"
echo ""
echo "  Usuario de deploy : ${DEPLOY_USER}"
echo "  App path          : ${APP_DIR}/current/"
echo ""
echo "  Postgres:"
echo "    BD              : ${DB_NAME}"
echo "    Usuario         : ${DB_USER}"
echo "    Contraseña      : ${DB_PASS}"
echo ""
echo "    DATABASE_URL para .env de producción:"
echo "    postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
echo ""
echo "  Próximos pasos:"
echo "    1. Pegar tu llave pública de deploy en /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo "    2. Crear /var/www/donot-platform/shared/.env.production con todas las vars"
echo "    3. Apuntar DNS de donot.cl a la IP del VPS"
echo "    4. Copiar deploy/nginx/donot.cl.conf a /etc/nginx/sites-available/donot.cl"
echo "    5. sudo certbot --nginx -d donot.cl -d www.donot.cl"
echo "    6. Configurar GitHub Actions secrets y disparar el primer deploy"
echo ""
