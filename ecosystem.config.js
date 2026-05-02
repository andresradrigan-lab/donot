/**
 * Configuración PM2 para producción.
 *
 * Path en VPS sugerido: /var/www/donot-platform/current/
 * Cómo lanzar:
 *   cd /var/www/donot-platform/current
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup     # solo la primera vez
 */
module.exports = {
  apps: [
    {
      name: 'donot',
      // En modo standalone, Next genera server.js en .next/standalone/server.js
      script: '.next/standalone/server.js',
      // Variables que necesita server.js
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      instances: 1, // KVM 2 → 2 vCPU; cluster mode si después se necesita
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      autorestart: true,
      // Logs en /home/<usuario>/.pm2/logs/donot-*.log por defecto
      time: true,
    },
  ],
}
