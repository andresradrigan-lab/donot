/**
 * Configuración PM2 para producción en Hostinger Cloud Hosting.
 *
 * Path en el servidor:
 *   ~/donot-platform/current/
 *
 * Cómo lanzar manualmente (release.sh lo hace solo):
 *   cd ~/donot-platform/current
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *
 * Carga .env.production explícitamente y lo expone como env de PM2.
 * Next.js standalone NO carga .env files automáticamente y `pm2 start`
 * no propaga el environment del shell, así que sin esto la app arranca
 * pero todas las queries fallan con "DATABASE_URL no configurado".
 */

const fs = require('fs')
const path = require('path')

function loadDotenv(file) {
  const env = {}
  if (!fs.existsSync(file)) return env
  const text = fs.readFileSync(file, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/i)
    if (!m) continue
    let [, key, value] = m
    // Remove surrounding quotes if present.
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const envFile = path.join(__dirname, '.env.production')
const envFromFile = loadDotenv(envFile)

module.exports = {
  apps: [
    {
      name: 'donot',
      script: '.next/standalone/server.js',
      cwd: '.',
      env: {
        ...envFromFile,
        NODE_ENV: 'production',
        PORT: envFromFile.PORT || '3000',
        HOSTNAME: envFromFile.HOSTNAME || '127.0.0.1',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      autorestart: true,
      time: true,
    },
  ],
}
