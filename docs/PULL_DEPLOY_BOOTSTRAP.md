# Pull-based deploy — bootstrap

Este es el "primer arranque" para migrar de push SSH a webhook pull-based.
Se ejecuta UNA SOLA VEZ por SSH al servidor. Después, todo deploy va por
`POST /api/deploy-hook`.

## 1. SSH al servidor

```bash
ssh -p 65002 u530306321@147.79.93.218
```

## 2. Clonar el repo

```bash
cd ~/donot-platform
# Si ya existe alguna carpeta repo/, mejor borrarla:
rm -rf repo
git clone https://github.com/andresradrigan-lab/donot.git repo
cd repo
```

## 3. Generar el secret de webhook

```bash
SECRET=$(openssl rand -base64 32)
echo "DEPLOY_HOOK_SECRET=${SECRET}"
```

Copiar ese secret. Vamos a usarlo en dos lugares:

## 4. Agregar el secret al `.env.production`

```bash
echo "DEPLOY_HOOK_SECRET=${SECRET}" >> ~/donot-platform/shared/.env.production
chmod 600 ~/donot-platform/shared/.env.production
```

## 5. Crear el wrapper de deploy

```bash
cat > ~/donot-platform/deploy.sh << 'EOF'
#!/usr/bin/env bash
exec bash ~/donot-platform/repo/deploy/scripts/local-deploy.sh "$@"
EOF
chmod +x ~/donot-platform/deploy.sh
```

## 6. Primer deploy manual

```bash
bash ~/donot-platform/deploy.sh origin/main
```

Esto:
- Hace `git pull` del repo
- `npm ci`, `prisma generate`, `npm run build`
- Aplica migraciones via `mariadb` CLI
- Switchea el symlink `current` al repo
- Reescribe `~/domains/donot.cl/public_html/{server.js, .htaccess, links}`
- Toca `tmp/restart.txt` para que Passenger recargue
- Health check con rollback si falla

Cuando termine, `https://donot.cl/api/health` debe responder 200.

## 7. Configurar GitHub secrets + variable

En el repo (https://github.com/andresradrigan-lab/donot):

**Settings → Secrets and variables → Actions:**

- **Secret** `DEPLOY_HOOK_URL` = `https://donot.cl/api/deploy-hook`
- **Secret** `DEPLOY_HOOK_SECRET` = el mismo SECRET del paso 3
- **Variable** (no secret) `DEPLOY_MODE` = `webhook`

Eso último es la "feature flag" — el workflow pasa de `push-deploy` a `notify` (webhook). Si querés volver al SSH, cambiá `DEPLOY_MODE` a `ssh` (o cualquier valor distinto de `webhook`).

## 8. Verificar end-to-end

Push un commit dummy a main. GitHub Actions debe:
1. Hacer POST al hook con HMAC válido
2. La app dispara local-deploy.sh en background
3. Health check final pasa

```bash
# Desde tu local:
echo "// touch" >> docs/PULL_DEPLOY_BOOTSTRAP.md
git add docs/PULL_DEPLOY_BOOTSTRAP.md
git commit -m "test: trigger pull deploy"
git push
```

## Cómo deployar manualmente

Si querés forzar un deploy sin pasar por GitHub Actions:

```bash
ssh -p 65002 u530306321@147.79.93.218
bash ~/donot-platform/deploy.sh origin/main
```

O por curl al webhook (necesita el secret):

```bash
SECRET="el-secret-real"
BODY='{"ref":"origin/main"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')
curl -X POST https://donot.cl/api/deploy-hook \
  -H "Content-Type: application/json" \
  -H "X-Deploy-Signature: $SIG" \
  --data "$BODY"
```

## Rollback rápido

```bash
ssh -p 65002 u530306321@147.79.93.218
cd ~/donot-platform/repo
git log --oneline | head -5            # elegir commit anterior
git checkout --detach <sha-anterior>
bash ~/donot-platform/deploy.sh "" $(git rev-parse HEAD)
```

`local-deploy.sh` también hace rollback automático si el health check post-deploy falla.
