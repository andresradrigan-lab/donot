# donot-platform

Plataforma e-commerce de **donot.** — donutería boutique de Concón–Reñaca.

Stack: Next.js 14 + TypeScript + PostgreSQL + Prisma + Tailwind.
Pasarelas: Mercado Pago, Transbank Webpay Plus, Khipu.
Despliegue objetivo: Hostinger VPS con PM2 + NGINX.

---

## Quickstart

### 1. Pega los assets de marca

Copia el contenido de tu carpeta de Desktop **"Do Not material"** dentro de `donot-material/`. El layout esperado está documentado en `CLAUDE.md` → sección "Assets de marca".

```bash
# Ejemplo (macOS):
cp -R ~/Desktop/Do\ Not\ material/* donot-material/
```

### 2. Levanta el entorno local

```bash
# Variables de entorno
cp .env.example .env
# Edita .env y pon valores de desarrollo (las claves productivas vienen después)

# Dependencias
npm install

# Postgres local con Docker
docker compose up -d

# Migraciones + seed (Droop 001 con sus 8 sabores reales)
npx prisma migrate dev
npx prisma db seed

# Arranca Next.js
npm run dev
```

Abre http://localhost:3000.

### 3. Empieza a construir con Claude Code

```bash
# Desde la raíz del repo
claude
```

Cuando arranque Claude Code, pídele:

> Lee CLAUDE.md y los documentos en docs/ en el orden indicado. Después dime cuál es el siguiente sprint en BACKLOG.md y cómo planeas abordarlo.

A partir de ahí, sigue los prompts sugeridos en `docs/PROMPTS.md`.

---

## Estructura del repo

```
donot-platform/
├── CLAUDE.md                 ← Punto de entrada del agente
├── README.md                 ← Este archivo
├── docs/
│   ├── SPEC.md               ← Especificación funcional
│   ├── PRODUCT_CATALOG.md    ← Droop 001, 8 sabores, 4 cajas
│   ├── DESIGN_SYSTEM.md      ← Paleta, tipografías, copy, mascota
│   ├── MOCKUP_REFERENCE.md   ← Flujo del configurador
│   ├── PAYMENT_INTEGRATIONS.md ← MP, Webpay, Khipu detalle
│   ├── BACKLOG.md            ← Sprints ordenados
│   └── PROMPTS.md            ← Prompts iniciales para Claude Code
├── donot-material/           ← Pega aquí tu carpeta de Desktop
├── prisma/
│   ├── schema.prisma         ← Modelo de datos completo
│   └── seed.ts               ← Carga Droop 001 + sabores reales
├── public/                   ← Assets servidos directos
├── scripts/                  ← Utilidades de mantenimiento
├── docker-compose.yml        ← Postgres local
├── package.json
├── tailwind.config.ts        ← Paleta donot. preconfigurada
├── tsconfig.json
└── .env.example
```

---

## Comandos útiles

```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build de producción
npm run start          # Servidor de producción local
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run db:reset       # Resetea la BD y re-seed (¡destructivo!)
npm run db:studio      # Prisma Studio (GUI de la BD)
```

---

## Documentación de referencia

- Levantamiento técnico completo (PDF/DOCX): entregable separado por MorgansMedia
- Mockup de configurador: https://app.optify.cl/presentaciones/prueba.html
- Calendario crítico: apertura local **2 mayo 2026**, Día de la Madre **10 mayo 2026**, feriado largo **21 mayo 2026**

---

## Autores y contacto

- **Solution Architect:** Andrés Radrigán — andresradrigan@morgansmedia.cl
- **Cliente:** Donut / Fernanda Rojas — f.rojas@optify.cl
- **Empresa contratante:** MM Inversiones SpA / MorgansMedia
