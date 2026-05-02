# DESIGN_SYSTEM.md — Sistema visual y de copy

> Esta es la guía oficial. Si Tailwind, un componente o un copy contradicen este documento, el documento gana.

---

## 1. Paleta oficial

Cinco colores. Sin grises arbitrarios. Los grises de UI funcional se derivan del verde (mismo hue, baja saturación).

| Token | Nombre | HEX | Uso |
|-------|--------|-----|-----|
| `verde` | Verde | `#005341` | Brand principal, headers, footer, tipografía del logo, badges, links |
| `crema` | Crema | `#FFF2E8` | Background del sitio, paneles suaves, áreas de contenido |
| `naranjo` | Naranjo | `#F36F4E` | CTAs primarios, alertas, énfasis en precios y descuentos |
| `azul-pastel` | Azul Pastel | `#B7CEF2` | Tags informativos, fondos de cards secundarias, estados "info" |
| `rosado` | Rosado | `#FF70C0` | Promos, drops nuevos, "sabor de la semana", elementos joviales |

Estos tokens están preconfigurados en `tailwind.config.ts` como `colors.donot.{verde,crema,naranjo,azulPastel,rosado}`. Úsalos siempre con esos nombres, no con HEX literales.

### Grises derivados (para UI funcional)

Estos no son colores de marca, son utilitarios:

| Token | HEX | Uso |
|-------|-----|-----|
| `donot.ink` | `#1F1F1F` | Texto cuerpo |
| `donot.muted` | `#5C6E68` | Texto secundario, placeholders |
| `donot.border` | `#DDD3C8` | Bordes sobre crema |
| `donot.rowAlt` | `#FBF7F1` | Filas alternadas en tablas |

---

## 2. Tipografías

### Para titulares: display redondeada estilo bubble

El logo "do not" es manuscrito grueso bubble. La tipografía web debe evocarlo sin replicarlo (el logo en sí es un PNG/SVG, no se reemplaza con tipografía web).

**Recomendación:** [Sniglet](https://fonts.google.com/specimen/Sniglet) (peso 800) o [Fredoka](https://fonts.google.com/specimen/Fredoka) (peso 700). Ambas en Google Fonts.

```ts
// app/layout.tsx
import { Sniglet, Inter } from 'next/font/google'

const sniglet = Sniglet({ subsets: ['latin'], weight: ['800'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
```

Usa Sniglet en h1/h2 y en CTAs prominentes. Para el resto, Inter.

### Para cuerpo: sans humanista neutra

[Inter](https://fonts.google.com/specimen/Inter) en pesos 400 (regular), 500 (medium), 600 (semibold). Es la default y cubre todo.

### Reglas

- Headings (h1–h3): `font-display` (Sniglet/Fredoka), color `donot.verde`.
- Body: `font-sans` (Inter), color `donot.ink`, line-height 1.6 mínimo.
- Botones: `font-display` para CTAs primarios; `font-sans semibold` para secundarios.
- **Nunca itálicas** salvo nombres propios o citas. La fuente bubble pierde legibilidad en itálica.

---

## 3. Mascota

La mascota canónica es la versión Crema/Verde (`donot-material/brand/Mascota Do Not Crema Verde.png`). Existe una variante Azul/Naranjo para uso secundario.

### Usos en la web

| Contexto | Variante | Tamaño |
|----------|----------|--------|
| Empty state del carrito | Crema/Verde | 200×250 |
| 404 / página no encontrada | Crema/Verde | 280×350 |
| Loader de pago (durante redirect a pasarela) | Crema/Verde animada (CSS bounce sutil) | 120×150 |
| Header de email transaccional | Crema/Verde | 80×100 |
| Confirmación post-pago (`/checkout/exito`) | Crema/Verde | 200×250 |
| Footer de la home | Azul/Naranjo (rotación visual) | 100×125 |

### Reglas

- **Nunca recortes** la mascota.
- **No la inviertas ni cambies sus colores.** Las dos variantes oficiales son las únicas válidas.
- **No la pongas sobre fondos saturados** (rojos, magentas). Solo sobre crema, verde oscuro, blanco o el azul-pastel oficial.

---

## 4. Tono de copy

La voz oficial está en el plan de contenidos del cliente: **jovial, urgente, irreverente, cercano**. Frases ejemplo: *"Esto NO debería existir"*, *"Tu nuevo plan de fin de semana"*, *"Quedan pocas, escribe DONAS"*.

### Reglas

- **Tú** (no usted, no vos). Siempre.
- **Imperativo amable** en CTAs: *"Quiero estas donas"*, *"Pasa a buscarlas"*, *"Reintenta en un toque"*.
- **Cero formalismos.** Nada de *"Estimado cliente"*, *"Sus cookies"*, *"Lamentamos los inconvenientes"*.
- **Humor seco** en errores y empty states. La marca no se disculpa formal — se ríe de sí misma.
- **Sin jerga de e-commerce.** No uses *"carrito"* despectivamente, no digas *"cart"*. Decimos **"cajita"**, *"tu cajita"*.
- **Las donas son donas, no donuts** — salvo en el nombre de la marca y en descripciones formales. *"6 donas premium"*, no *"6 donuts"*.

### Diccionario de UI

| Concepto técnico | Cómo lo dice donot. |
|------------------|---------------------|
| Add to cart | "Quiero estas donas" / "Agregar a mi cajita" |
| Empty cart | "Tu cajita está vacía. Y eso está mal." |
| Checkout button | "Ir a pagar" / "Quiero estas donas" |
| Order confirmed | "Listo. Tus donitas están reservadas." |
| Out of stock | "Se acabaron. Vuelve mañana o avísanos." |
| No coverage | "Por ahora no llegamos a tu comuna. Pero sí puedes pasar a buscarlas." |
| Generic error | "Algo se nos quemó en el horno. Reintenta en un toque." |
| 404 | "Esta página no existe. Las donas, sí." |
| Coupon invalid | "Ese código no anda. Prueba otro." |
| Free shipping unlocked | "¡Listo! Tu envío va por la casa." |
| Loading payment | "Estamos preparando tu pago…" |

Estos copies son guías. Si necesitas uno nuevo, sigue el mismo registro.

---

## 5. Componentes — guías rápidas

### Botón primario (CTA)

```tsx
<button className="
  bg-donot-naranjo text-white
  font-display text-lg
  px-6 py-3 rounded-full
  hover:bg-donot-naranjo/90 transition
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Quiero estas donas
</button>
```

Por qué: rounded-full (matchea las formas redondeadas del logo y de las donas), font-display (consistencia tipográfica), naranjo sobre crema (contraste alto).

### Botón secundario

```tsx
<button className="
  border-2 border-donot-verde text-donot-verde
  font-sans font-semibold
  px-6 py-3 rounded-full
  hover:bg-donot-verde hover:text-white transition
">
  Ver más
</button>
```

### Card de caja

Estructura sugerida:

- Imagen del producto (16:9 o 1:1 según el grid)
- Nombre en `font-display text-donot-verde`
- Precio en `font-display text-donot-naranjo` (acento)
- Botón primario "Elegir"
- Border `1px solid donot.border`, `rounded-2xl`, sombra suave
- Background: blanco o crema, según contexto

### Header del sitio

- Background crema
- Logo verde a la izquierda (la versión Verde Fondo Crema)
- Nav simple (Home, Drop, Sobre nosotros, Contacto)
- Carrito a la derecha con badge naranjo de cantidad

### Footer

- Background verde (`donot.verde`)
- Logo crema (la versión Crema Fondo Verde)
- Links de navegación + redes sociales en crema
- Mascota Azul/Naranjo en una esquina como decoración

---

## 6. Iconos

Usa **Lucide React** (`lucide-react`) para todos los iconos de UI. Es minimalista y consistente. Tamaños estándar: 16, 20, 24.

```tsx
import { ShoppingBag, Plus, Minus, Check, X, Clock, MapPin } from 'lucide-react'
```

**No mezcles** Lucide con FontAwesome u otro set. Tampoco uses emojis como iconos en UI funcional (salvo donde el copy lo justifica narrativamente — un 🍩 en el header del email transaccional sí, en un botón de "guardar" no).

---

## 7. Espaciado y radios

- Sistema basado en 4px: `4, 8, 12, 16, 24, 32, 48, 64, 96`
- Radios: `8` (inputs), `12` (cards pequeñas), `16` (cards grandes), `24` (modales), `9999` (botones pill)
- Sombras: solo dos niveles
  - `shadow-soft`: `0 2px 8px rgba(0, 83, 65, 0.08)` (cards)
  - `shadow-pop`: `0 8px 24px rgba(0, 83, 65, 0.12)` (modales, dropdowns abiertos)

Definir ambos en `tailwind.config.ts` como `boxShadow`.

---

## 8. Accesibilidad

- Contraste AA mínimo en todo texto.
- `verde` sobre `crema`: ratio ≈ 11.5 — cumple AA y AAA, perfecto para body.
- `naranjo` sobre `crema`: ratio ≈ 4.7 — cumple AA solo para texto grande (≥18px). Para texto pequeño usa naranjo solo en énfasis (precios, badges) y verde para el resto.
- Botones siempre tienen estado `:focus-visible` con `outline-2 outline-donot-naranjo outline-offset-2`.
- Inputs tienen label visible (no solo placeholder).
- Imágenes tienen `alt` descriptivo (la mascota: `alt="Mascota de donot."`).
