# DEPLOY.md

El deploy a producción usa la **integración nativa de Hostinger con
GitHub**: cada push a `main` dispara build + deploy automático en los
runners de Hostinger.

→ Ver [HOSTINGER_DEPLOY.md](HOSTINGER_DEPLOY.md) para la guía paso a paso.

## Atajos

- Ver deployments: hPanel → Sitios web → donot.cl → Deployments
- Rollback: click en una deployment anterior → Redeploy
- Logs: hPanel → Sitios web → donot.cl → Logs
- Health check: `curl https://donot.cl/api/health` → 200
