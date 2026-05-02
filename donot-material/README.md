# donot-material/

Esta carpeta contiene los **assets de marca** que el cliente entregó. **No se commitea al repo** (ver `.gitignore`).

## Cómo poblar esta carpeta

Copia el contenido de tu carpeta de Desktop **"Do Not material"** acá. El layout esperado es:

```
donot-material/
├── brand/
│   ├── Do Not Verde Fondo Crema.png
│   ├── Do Not Crema Fondo Verde.png
│   ├── Do Not Naranjo Fondo Azul Claro Pastel.png
│   ├── Do Not Rosado Fondo Verde.png
│   ├── Do Not Verde Fondo Rosado.png
│   ├── Mascota Do Not Crema Verde.png
│   └── Mascota Do Not Azul y Naranjo.png
└── menu/
    ├── 21.png   (Cookies & Cream)
    ├── 22.png   (Crème Brûlée)
    ├── 23.png   (Pie de Limón)
    ├── 24.png   (Glaseada)
    ├── 25.png   (Crocanti)
    ├── 26.png   (Pie de Manzana)
    ├── 27.png   (Tiramisú)
    └── 28.png   (Alfajor)
```

### Comandos típicos

**macOS:**
```bash
cp -R ~/Desktop/Do\ Not\ material/* ./donot-material/
```

**Linux/WSL:**
```bash
cp -R "/mnt/c/Users/TU_USUARIO/Desktop/Do Not material/"* ./donot-material/
```

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse "$env:USERPROFILE\Desktop\Do Not material\*" .\donot-material\
```

## Qué hace Claude Code con estos archivos

En el **Sprint 0** (ver `docs/BACKLOG.md`), el agente:
1. Verifica que existan todos los archivos esperados.
2. Los **copia** (no mueve) a `public/brand/` y `public/menu/` con nombres en kebab-case.
3. El seed de Prisma (`prisma/seed.ts`) referencia los nombres ya normalizados en `public/`.

Los assets originales en `donot-material/` quedan intactos como respaldo y como fuente de verdad.

## ¿Por qué no commiteamos esta carpeta?

- Son assets propiedad del cliente (Donut). El repo se considera código compartido pero los assets son privados.
- Los archivos pesan ~22 MB en total (las fotos del menú son alta resolución). El repo se mantiene liviano.
- El layout en `public/` ya tiene los nombres canónicos que el código importa, así que el sistema funciona sin que esta carpeta esté en el repo.

Para entornos productivos: estos assets se suben a Cloudinary o S3 y `public/` solo guarda los archivos optimizados que el seed espera.
