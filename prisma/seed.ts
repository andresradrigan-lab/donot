/**
 * Seed de la BD con el catálogo real de donot.
 *
 * Carga:
 * - Droop 001 (colección activa)
 * - 8 sabores premium con descripciones oficiales
 * - 4 cajas (2 premium activas, 2 azucaradas inactivas)
 * - 6 zonas de cobertura iniciales
 * - 2 cupones de ejemplo
 * - 1 usuario admin OWNER inicial
 * - Configuración del sitio (umbrales de envío gratis, etc.)
 *
 * Ejecutar: npm run db:seed
 * Resetear y re-correr: npm run db:reset
 *
 * Fuente de verdad: docs/PRODUCT_CATALOG.md
 * NO modifiques los nombres ni descripciones de los sabores aquí —
 * esos copies vienen del menú oficial entregado por el cliente.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🍩  Seeding donot. database...')

  // ============================================================
  // 1. Site settings (configuración global)
  // ============================================================
  const settings = [
    {
      key: 'free_shipping_threshold_clp',
      value: process.env.DEFAULT_FREE_SHIPPING_THRESHOLD_CLP ?? '50000',
      description: 'Subtotal en CLP a partir del cual el envío es gratis',
    },
    {
      key: 'free_shipping_min_boxes',
      value: process.env.DEFAULT_FREE_SHIPPING_MIN_BOXES ?? '3',
      description: 'Cantidad de cajas a partir de la cual el envío es gratis',
    },
    {
      key: 'pickup_address_concon',
      value: 'A confirmar — pendiente con cliente',
      description: 'Dirección de retiro en Concón',
    },
    {
      key: 'pickup_address_renaca',
      value: 'A confirmar — pendiente con cliente',
      description: 'Dirección de retiro en Reñaca',
    },
    {
      key: 'order_number_prefix',
      value: process.env.ORDER_NUMBER_PREFIX ?? 'DN',
      description: 'Prefijo de los números de pedido (DN-2026-0001, etc.)',
    },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    })
  }
  console.log(`  ✓ ${settings.length} site settings`)

  // ============================================================
  // 2. Droop 001 — colección activa
  // ============================================================
  const droop001 = await prisma.droop.upsert({
    where: { code: 'droop_001' },
    update: {},
    create: {
      code: 'droop_001',
      name: 'Droop 001',
      tagline: 'La primera carga',
      description:
        'Nuestra primera colección. 8 sabores premium pensados para sorprenderte sin pretensiones.',
      coverImage: '/menu/cookies-and-cream.png',
      startsAt: new Date('2026-04-01T00:00:00Z'),
      endsAt: null, // indefinida en MVP
      isPublished: true,
      sortOrder: 1,
    },
  })
  console.log(`  ✓ Droop: ${droop001.name}`)

  // ============================================================
  // 3. Sabores oficiales del Droop 001
  //    Descripciones LITERALES del menú entregado por el cliente.
  //    NO MODIFICAR.
  // ============================================================
  const flavors = [
    {
      slug: 'cookies-and-cream',
      name: 'Cookies & Cream',
      description:
        'Rellena con crema de vainilla, topping de frosting de oreo con galleta molida, bañada en chocolate blanco.',
      imageUrl: '/menu/cookies-and-cream.png',
      sortOrder: 1,
    },
    {
      slug: 'creme-brulee',
      name: 'Crème Brûlée',
      description:
        'Donut rellena de suave crema brûlée, coronada con una fina capa de caramelo duro.',
      imageUrl: '/menu/creme-brulee.png',
      sortOrder: 2,
    },
    {
      slug: 'pie-de-limon',
      name: 'Pie de Limón',
      description:
        'Rellena con curl de limón, coronada con un disco de merengue blanco flameado y un toque de curl de limón en el centro.',
      imageUrl: '/menu/pie-de-limon.png',
      sortOrder: 3,
    },
    {
      slug: 'glaseada',
      name: 'Glaseada',
      description:
        'La clásica donut sin relleno, cubierta con un glaseado brillante y suave.',
      imageUrl: '/menu/glaseada.png',
      sortOrder: 4,
    },
    {
      slug: 'crocanti',
      name: 'Crocanti',
      description:
        'Rellena con dulce de leche, bañada en chocolate 65% cacao con frutos secos en trozos.',
      imageUrl: '/menu/crocanti.png',
      sortOrder: 5,
    },
    {
      slug: 'pie-de-manzana',
      name: 'Pie de Manzana',
      description:
        'Rellena con crema de mascarpone, crema de manzana, topping con disco de galleta sablé y compota de manzana caramelizada con trozos de fruta.',
      imageUrl: '/menu/pie-de-manzana.png',
      sortOrder: 6,
    },
    {
      slug: 'tiramisu',
      name: 'Tiramisú',
      description:
        'Rellena de ganache de café, rebozada en azúcar y vainilla. Decorada con un disco de chocolate con crema de queso y cacao amargo en polvo.',
      imageUrl: '/menu/tiramisu.png',
      sortOrder: 7,
    },
    {
      slug: 'alfajor',
      name: 'Alfajor',
      description:
        'Nuestra clásica donut, rellena de dulce de leche casero, con un alfajor de masa sablé y azúcar flor de topping.',
      imageUrl: '/menu/alfajor.png',
      sortOrder: 8,
    },
  ]

  for (const f of flavors) {
    await prisma.flavor.upsert({
      where: { slug: f.slug },
      update: {
        // permitir actualizar copies si cambian
        name: f.name,
        description: f.description,
        imageUrl: f.imageUrl,
        sortOrder: f.sortOrder,
      },
      create: {
        ...f,
        category: 'PREMIUM',
        droopId: droop001.id,
        stock: 50, // capacidad inicial diaria
        stockResetDaily: true,
        dailyCapacity: 50,
        isActive: true,
      },
    })
  }
  console.log(`  ✓ ${flavors.length} sabores Droop 001`)

  // ============================================================
  // 4. Cajas (productos principales)
  // ============================================================
  const boxes = [
    {
      slug: 'caja-6-premium',
      name: 'Cajita 6 Premium',
      category: 'PREMIUM' as const,
      slotCount: 6,
      priceClp: 19990,
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: 'caja-4-premium',
      name: 'Cajita 4 Premium',
      category: 'PREMIUM' as const,
      slotCount: 4,
      priceClp: 15990,
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: 'caja-6-azucaradas',
      name: 'Cajita 6 Azucaradas',
      category: 'AZUCARADA' as const,
      slotCount: 6,
      priceClp: 15990,
      isActive: false, // próximamente — pendiente Droop 002
      sortOrder: 3,
    },
    {
      slug: 'caja-4-azucaradas',
      name: 'Cajita 4 Azucaradas',
      category: 'AZUCARADA' as const,
      slotCount: 4,
      priceClp: 10990,
      isActive: false,
      sortOrder: 4,
    },
  ]

  for (const b of boxes) {
    await prisma.box.upsert({
      where: { slug: b.slug },
      update: {
        priceClp: b.priceClp,
        isActive: b.isActive,
        sortOrder: b.sortOrder,
      },
      create: {
        ...b,
        images: [], // cargar fotos cuando estén las cajas armadas fotografiadas
      },
    })
  }
  console.log(`  ✓ ${boxes.length} cajas`)

  // ============================================================
  // 5. Zonas de cobertura
  // ============================================================
  const zones = [
    { commune: 'Concón',          region: 'Valparaíso', shippingClp: 1500, sortOrder: 1 },
    { commune: 'Reñaca',          region: 'Valparaíso', shippingClp: 1500, sortOrder: 2 },
    { commune: 'Viña del Mar',    region: 'Valparaíso', shippingClp: 2000, sortOrder: 3 },
    { commune: 'Valparaíso',      region: 'Valparaíso', shippingClp: 2000, sortOrder: 4 },
    { commune: 'Quilpué',         region: 'Valparaíso', shippingClp: 2500, sortOrder: 5 },
    { commune: 'Villa Alemana',   region: 'Valparaíso', shippingClp: 2500, sortOrder: 6 },
  ]

  for (const z of zones) {
    await prisma.coverageZone.upsert({
      where: { commune_region: { commune: z.commune, region: z.region } },
      update: { shippingClp: z.shippingClp, sortOrder: z.sortOrder },
      create: { ...z, isActive: true },
    })
  }
  console.log(`  ✓ ${zones.length} zonas de cobertura`)

  // ============================================================
  // 6. Cupones de ejemplo
  // ============================================================
  await prisma.coupon.upsert({
    where: { code: 'BIENVENIDA10' },
    update: {},
    create: {
      code: 'BIENVENIDA10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderClp: 15000,
      maxUses: 1000,
      validFrom: new Date('2026-05-01T00:00:00Z'),
      validTo: new Date('2026-12-31T23:59:59Z'),
      isActive: true,
    },
  })

  await prisma.coupon.upsert({
    where: { code: 'ENVIOGRATIS' },
    update: {},
    create: {
      code: 'ENVIOGRATIS',
      type: 'FREE_SHIPPING',
      value: 0,
      minOrderClp: 25000,
      validFrom: new Date('2026-05-01T00:00:00Z'),
      isActive: true,
    },
  })
  console.log(`  ✓ 2 cupones de ejemplo`)

  // ============================================================
  // 7. Usuario admin inicial (OWNER)
  // ============================================================
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL ?? 'andres@morgansmedia.cl'
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD ?? 'changeme_in_first_login'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Andrés Radrigán',
      role: 'OWNER',
      isActive: true,
    },
  })
  console.log(`  ✓ Admin OWNER inicial: ${adminEmail}`)
  console.log(`     Password inicial: ${adminPassword}`)
  console.log(`     ⚠  Cambiar en primer login`)

  console.log('\n🍩  Seed completado.\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
