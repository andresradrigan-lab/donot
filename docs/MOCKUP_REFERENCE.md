# MOCKUP_REFERENCE.md — Flujo del configurador

> El cliente validó un mockup HTML del configurador de cajas. Este documento describe el flujo en detalle. **Antes de implementar la página `/caja/[slug]`, revisa el mockup directamente:**
>
> **https://app.optify.cl/presentaciones/prueba.html**

---

## Contexto del mockup

Es un single-page de 2 pasos donde el usuario:
1. Selecciona qué tipo de caja quiere
2. Llena los slots de la caja eligiendo sabores

El mockup actual termina en "Finalizar en WhatsApp". Esto se reemplaza por nuestro flujo de checkout real (ver `SPEC.md` § 3.1).

El mockup es solo una **guía de UX y secuencia**. El estilo visual real lo define `DESIGN_SYSTEM.md` (paleta donot, tipografía Sniglet/Inter, mascota, copies en tono de marca). No copies los estilos del mockup tal cual: aplica el sistema de diseño oficial.

---

## Estructura del mockup (verificada con web_fetch)

```
do not  /  REINICIAR

# do not

Paso 1: Selecciona tu cajita

🍩

[Card] Cajita de 6
       Sabores Drop 001
       $19.990
       [ELEGIR]

[Card] Caja 4 Premium
       Lo mejor de la casa
       $15.990
       [ELEGIR]

[Card] 6 Azucaradas
       Tradicionales y ricas
       $15.990
       [ELEGIR]

[Card] 4 Azucaradas
       Para el café
       $10.990
       [ELEGIR]

## Paso 2: Elige tus sabores

Tu selección

0/0

[Finalizar en WhatsApp]
```

---

## Flujo paso a paso (cómo lo implementamos)

### Paso 1 — Selección de caja

**Ruta:** `/` (home) o `/caja/[slug]` (entrada directa).

- Si el usuario llega a `/`, ve las 4 cards (las 4 cajas) con su nombre, copy bajada, precio y CTA "Elegir".
- Las cards usan el componente `BoxCard` (ver § "Componentes"). Diseño: card vertical, imagen arriba, nombre + bajada + precio + CTA abajo.
- En MVP, las cards de cajas Azucaradas se renderizan como inactivas con un overlay "Próximamente — Droop 002".
- Al hacer click en "Elegir" → navega a `/caja/[slug]?step=2`.

### Paso 2 — Selección de sabores

**Ruta:** `/caja/[slug]` con estado interno de paso.

Layout sugerido:

```
┌─────────────────────────────────────────┐
│  ← Volver       do not.        🛒 (2)   │
├─────────────────────────────────────────┤
│                                         │
│  Paso 2 de 2 — Elige tus sabores        │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Cajita 6 Premium · $19.990         │ │
│  │ Tu selección: 3/6                  │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ [foto]   │ │ [foto]   │ │ [foto]   │ │
│  │ Tiramisú │ │ Alfajor  │ │ Crocanti │ │
│  │  - 1 +   │ │  - 0 +   │ │  - 2 +   │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ ...      │ │ ...      │ │ ...      │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                         │
│  [   Quiero estas donas   ]             │
│  (deshabilitado hasta llegar a 6/6)     │
│                                         │
└─────────────────────────────────────────┘
```

### Comportamiento del paso 2

1. Al cargar la página, hacer fetch de:
   - La caja por slug (con `slot_count` y `category`).
   - Los sabores compatibles: filtrados por `category` ∩ `Droop` activo ∩ `is_active=true` ∩ `stock > 0` ∩ `available_weekdays` incluye hoy.
2. Renderizar grid de sabores (3 columnas en desktop, 2 en mobile).
3. Cada sabor tiene un control `−  N  +`:
   - El `+` se deshabilita si `total_seleccionado >= slot_count`.
   - El `−` se deshabilita si la cantidad de ese sabor es 0.
4. Mostrar contador prominente `X/N` (3/6, 4/6, etc.). Cambia de color a verde cuando `X = N`.
5. El botón "Quiero estas donas" está deshabilitado hasta `X = N`.
6. Al confirmar → agregar a carrito (localStorage para invitados, BD para usuarios logueados en Fase 2) → redirige a `/carrito`.

### Reglas de validación

- Se permite repetir sabores. Un usuario puede poner 6 Tiramisú si quiere.
- Si `X > N` (no debería ocurrir por la validación del +, pero por las dudas), bloquear submit.
- Si un sabor se agota mientras el usuario configura (caso raro), el siguiente click en "+" debe avisar y refrescar.

---

## Componentes principales involucrados

### `<BoxCard>` (paso 1)

```tsx
// components/store/BoxCard.tsx
interface Props {
  box: Box  // del modelo Prisma
  href?: string
  inactive?: boolean
}
```

Layout:
- Imagen arriba (16:9 o 1:1)
- Nombre (`font-display text-donot-verde`)
- Bajada / categoría (`text-donot-muted text-sm`)
- Precio (`font-display text-donot-naranjo text-2xl`)
- Botón "Elegir" (primario)
- Si `inactive=true`: overlay crema/80 con texto "Próximamente"

### `<FlavorPicker>` (paso 2)

```tsx
// components/store/FlavorPicker.tsx
interface Props {
  flavors: Flavor[]
  slotCount: number
  onConfirm: (selection: Record<string, number>) => void
}
```

Estado interno: `Record<flavorId, qty>`. Total = `sum(values)`.

### `<FlavorTile>` (sub-componente)

Card pequeña con foto, nombre, descripción corta y control +/-.

### `<SlotCounter>`

Indicador `X/N` grande, sticky en mobile.

---

## Animaciones / micro-interacciones (opcional, nice-to-have)

- Al llegar a `slot_count` (X = N), pulse sutil del contador en color verde.
- Al hacer click en "+", la mini-foto de la dona "salta" (scale 1.05, 200ms).
- El botón "Quiero estas donas" hace fade-in cuando se activa.

Si el sprint va apretado, todo esto es opcional. La funcionalidad pura es la prioridad.

---

## Mobile-first

- > 70% del tráfico esperado es mobile.
- Grid del paso 2: **2 columnas en mobile**, 3 en tablet, 4 en desktop.
- Botón "Quiero estas donas" sticky al fondo en mobile (siempre visible).
- Contador `X/N` sticky al header en mobile.
- Tamaño táctil mínimo de los botones +/−: 44×44 px.

---

## Lo que NO está en el mockup pero sí debe estar

- **Foto real del sabor** en cada tile (el mockup usa solo nombre).
- **Descripción corta** debajo del nombre (1 línea).
- **Mascota** en el empty state si entras al paso 2 sin haber elegido caja (caso edge).
- **Breadcrumb / botón volver** al paso 1 sin perder el progreso (UX importante).
- **Persistencia en localStorage** del progreso, por si el usuario refresca.
