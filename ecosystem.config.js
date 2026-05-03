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
 * En Hostinger la "aplicación Node.js" se registra desde hPanel apuntando
 * a ~/donot-platform/current/ con startup file
 * `.next/standalone/server.js`. Hostinger maneja el reverse proxy y SSL
 * del dominio donot.cl.
 */
module.exports = {
  apps: [
    {
      name: 'donot',
      script: '.next/standalone/server.js',
      cwd: '.',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
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
