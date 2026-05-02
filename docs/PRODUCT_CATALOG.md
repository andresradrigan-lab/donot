# PRODUCT_CATALOG.md — Catálogo real

> Esta es la fuente de verdad para nombres, precios y descripciones. Los textos están **palabra por palabra** del menú oficial entregado por el cliente. No los reescribas, traduzcas ni "mejores".

---

## Droop 001 (colección activa)

- **Code:** `droop_001`
- **Name:** `Droop 001`
- **Tagline:** `La primera carga` (placeholder — confirmar con cliente si quiere otra)
- **Categoría:** Premium
- **Vigencia:** Indefinida en MVP. Cuando el cliente lance Droop 002, este pasa a `is_published=false` o se le asigna un `ends_at`.
- **Cover image:** `donot-material/menu/21.png` (o cualquier sabor representativo — coordinar con cliente)

### Sabores del Droop 001 (8 piezas premium)

| # | Nombre oficial | Slug | Asset original | Asset en `public/menu/` |
|---|----------------|------|----------------|-------------------------|
| 1 | Cookies & Cream | `cookies-and-cream` | `donot-material/menu/21.png` | `public/menu/cookies-and-cream.png` |
| 2 | Crème Brûlée | `creme-brulee` | `donot-material/menu/22.png` | `public/menu/creme-brulee.png` |
| 3 | Pie de Limón | `pie-de-limon` | `donot-material/menu/23.png` | `public/menu/pie-de-limon.png` |
| 4 | Glaseada | `glaseada` | `donot-material/menu/24.png` | `public/menu/glaseada.png` |
| 5 | Crocanti | `crocanti` | `donot-material/menu/25.png` | `public/menu/crocanti.png` |
| 6 | Pie de Manzana | `pie-de-manzana` | `donot-material/menu/26.png` | `public/menu/pie-de-manzana.png` |
| 7 | Tiramisú | `tiramisu` | `donot-material/menu/27.png` | `public/menu/tiramisu.png` |
| 8 | Alfajor | `alfajor` | `donot-material/menu/28.png` | `public/menu/alfajor.png` |

### Descripciones oficiales (NO MODIFICAR)

**Cookies & Cream**
> Rellena con crema de vainilla, topping de frosting de oreo con galleta molida, bañada en chocolate blanco.

**Crème Brûlée**
> Donut rellena de suave crema brûlée, coronada con una fina capa de caramelo duro.

**Pie de Limón**
> Rellena con curl de limón, coronada con un disco de merengue blanco flameado y un toque de curl de limón en el centro.

**Glaseada**
> La clásica donut sin relleno, cubierta con un glaseado brillante y suave.

**Crocanti**
> Rellena con dulce de leche, bañada en chocolate 65% cacao con frutos secos en trozos.

**Pie de Manzana**
> Rellena con crema de mascarpone, crema de manzana, topping con disco de galleta sablé y compota de manzana caramelizada con trozos de fruta.

**Tiramisú**
> Rellena de ganache de café, rebozada en azúcar y vainilla. Decorada con un disco de chocolate con crema de queso y cacao amargo en polvo.

**Alfajor**
> Nuestra clásica donut, rellena de dulce de leche casero, con un alfajor de masa sablé y azúcar flor de topping.

---

## Cajas (productos principales)

| Slug | Nombre | Slots | Precio (CLP) | Categoría | Estado MVP |
|------|--------|-------|--------------|-----------|------------|
| `caja-6-premium` | Cajita 6 Premium | 6 | 19990 | PREMIUM | Activa |
| `caja-4-premium` | Cajita 4 Premium | 4 | 15990 | PREMIUM | Activa |
| `caja-6-azucaradas` | Cajita 6 Azucaradas | 6 | 15990 | AZUCARADA | **Inactiva (próximamente)** |
| `caja-4-azucaradas` | Cajita 4 Azucaradas | 4 | 10990 | AZUCARADA | **Inactiva (próximamente)** |

### Reglas de las cajas

- Una caja `category=PREMIUM` solo acepta sabores `category=PREMIUM`.
- Una caja `category=AZUCARADA` solo acepta sabores `category=AZUCARADA`.
- En MVP solo las cajas premium están activas (las azucaradas se publican como inactivas hasta tener los sabores listos — esto se resolverá en Droop 002).
- El precio es fijo. No hay sobrecargo por sabor en MVP.
- Se permite repetir sabores dentro de la misma caja.

### Imágenes de catálogo de las cajas

Para MVP, cada caja usa como imagen un mosaico de 4 o 6 sabores representativos del Droop activo. Hasta tener fotografías de cajas armadas, se puede usar una imagen genérica con la mascota.

Mapeo sugerido (ajustable):
- `caja-6-premium`: mosaico de 6 sabores Droop 001
- `caja-4-premium`: mosaico de 4 sabores Droop 001
- Las azucaradas: usar la mascota como placeholder con tag "Próximamente"

---

## Despacho — comunas iniciales (placeholder)

> Pendiente confirmar con cliente. Cargar estas como activas en seed; ajustar después.

| Comuna | Región | Tarifa (CLP) |
|--------|--------|--------------|
| Concón | Valparaíso | 1500 |
| Reñaca | Valparaíso | 1500 |
| Viña del Mar | Valparaíso | 2000 |
| Valparaíso | Valparaíso | 2000 |
| Quilpué | Valparaíso | 2500 |
| Villa Alemana | Valparaíso | 2500 |

**Umbral de envío gratis (global, configurable en `SiteSetting`):** sobre $50.000 CLP de subtotal o ≥ 3 cajas.

**Puntos de retiro:**
- Concón: dirección a confirmar con cliente
- Reñaca: dirección a confirmar con cliente

---

## Cupones de ejemplo (para seed, opcional)

| Código | Tipo | Valor | Min. pedido | Notas |
|--------|------|-------|-------------|-------|
| `BIENVENIDA10` | PERCENTAGE | 10 | 15000 | Solo primer pedido (validación por email único) — Fase 2 |
| `ENVIOGRATIS` | FREE_SHIPPING | — | 25000 | Envío gratis sobre 25K |

---

## Cómo cargar todo esto en la BD

El archivo `prisma/seed.ts` carga todo lo de arriba al ejecutar `npx prisma db seed`. Si modificas precios o agregas sabores, edita el seed (no la BD directa) y vuelve a correrlo con `npm run db:reset` (destructivo) o haciendo upsert manual.
