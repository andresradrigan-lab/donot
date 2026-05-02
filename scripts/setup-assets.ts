#!/usr/bin/env tsx
/**
 * scripts/setup-assets.ts
 *
 * Verifica que donot-material/ tenga los assets esperados y los copia
 * a public/brand/ y public/menu/ con nombres normalizados.
 *
 * Uso: npx tsx scripts/setup-assets.ts
 *
 * Idempotente: se puede correr varias veces. Sobreescribe destinos.
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const SRC_BRAND = join(ROOT, 'donot-material/brand')
const SRC_MENU  = join(ROOT, 'donot-material/menu')
const DST_BRAND = join(ROOT, 'public/brand')
const DST_MENU  = join(ROOT, 'public/menu')

const BRAND_MAP: Record<string, string> = {
  'Do Not Verde Fondo Crema.png':              'do-not-verde-fondo-crema.png',
  'Do Not Crema Fondo Verde.png':              'do-not-crema-fondo-verde.png',
  'Do Not Naranjo Fondo Azul Claro Pastel.png':'do-not-naranjo-fondo-azul.png',
  'Do Not Rosado Fondo Verde.png':             'do-not-rosado-fondo-verde.png',
  'Do Not Verde Fondo Rosado.png':             'do-not-verde-fondo-rosado.png',
  'Mascota Do Not Crema Verde.png':            'mascota-crema-verde.png',
  'Mascota Do Not Azul y Naranjo.png':         'mascota-azul-naranjo.png',
}

const MENU_MAP: Record<string, string> = {
  '21.png': 'cookies-and-cream.png',
  '22.png': 'creme-brulee.png',
  '23.png': 'pie-de-limon.png',
  '24.png': 'glaseada.png',
  '25.png': 'crocanti.png',
  '26.png': 'pie-de-manzana.png',
  '27.png': 'tiramisu.png',
  '28.png': 'alfajor.png',
}

function copyMap(src: string, dst: string, map: Record<string, string>, label: string) {
  if (!existsSync(src)) {
    console.error(`❌ No existe: ${src}`)
    console.error(`   Esperaba la carpeta donot-material/. Lee donot-material/README.md.`)
    process.exit(1)
  }
  mkdirSync(dst, { recursive: true })

  const present = new Set(readdirSync(src))
  const missing: string[] = []
  let copied = 0

  for (const [original, normalized] of Object.entries(map)) {
    if (!present.has(original)) {
      missing.push(original)
      continue
    }
    copyFileSync(join(src, original), join(dst, normalized))
    copied++
  }

  console.log(`  ✓ ${label}: ${copied}/${Object.keys(map).length} copiados → ${dst}`)
  if (missing.length) {
    console.warn(`  ⚠ Faltan en ${src}:`)
    missing.forEach(m => console.warn(`     - ${m}`))
  }
}

console.log('🍩  Setup de assets donot.\n')
copyMap(SRC_BRAND, DST_BRAND, BRAND_MAP, 'Brand')
copyMap(SRC_MENU,  DST_MENU,  MENU_MAP,  'Menu')
console.log('\n✓  Assets listos en public/.')
