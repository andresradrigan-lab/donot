import { z } from 'zod'

const slug = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, guiones y "_"')

export const droopSchema = z.object({
  code: slug,
  name: z.string().min(1).max(80),
  tagline: z.string().max(120).optional().nullable(),
  description: z.string().max(800).optional().nullable(),
  coverImage: z.string().max(400).optional().nullable(),
  startsAt: z.string().min(1), // ISO
  endsAt: z.string().min(1).optional().nullable(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const flavorSchema = z.object({
  slug,
  name: z.string().min(1).max(80),
  category: z.enum(['PREMIUM', 'AZUCARADA']),
  description: z.string().min(1).max(800),
  imageUrl: z.string().min(1).max(400),
  droopId: z.string().uuid().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  stockResetDaily: z.boolean().default(false),
  dailyCapacity: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  availableWeekdays: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  sortOrder: z.number().int().default(0),
})

export const boxSchema = z.object({
  slug,
  name: z.string().min(1).max(80),
  category: z.enum(['PREMIUM', 'AZUCARADA', 'MIX', 'COLAB']),
  slotCount: z.number().int().min(1).max(24),
  priceClp: z.number().int().min(0),
  images: z.array(z.string().max(400)).default([]),
  isActive: z.boolean().default(true),
  availableWeekdays: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  availableFrom: z.string().nullable().optional(),
  availableTo: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
})

export const couponSchema = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números, "-" y "_"'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().int().min(0),
  minOrderClp: z.number().int().min(0).optional().nullable(),
  maxUses: z.number().int().min(0).optional().nullable(),
  maxUsesPerUser: z.number().int().min(0).optional().nullable(),
  validFrom: z.string().min(1),
  validTo: z.string().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
})

export const coverageZoneSchema = z.object({
  commune: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  shippingClp: z.number().int().min(0),
  freeShippingThresholdClp: z.number().int().min(0).optional().nullable(),
  freeShippingMinBoxes: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const adminUserCreateSchema = z.object({
  email: z.string().email().max(160),
  name: z.string().min(1).max(120),
  role: z.enum(['OWNER', 'OPERATOR', 'VIEWER']),
  password: z.string().min(8).max(200),
  isActive: z.boolean().default(true),
})

export const adminUserUpdateSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.enum(['OWNER', 'OPERATOR', 'VIEWER']),
  isActive: z.boolean().default(true),
  password: z.string().min(8).max(200).optional().nullable(),
})

export const settingsSchema = z.record(z.string().max(80), z.string().max(2000))

export const galleryImageSchema = z.object({
  imageUrl: z.string().min(1).max(500),
  caption: z.string().max(240).optional().nullable(),
  alt: z.string().max(240).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
})

export const blogPostSchema = z.object({
  slug: slug,
  title: z.string().min(1).max(160),
  excerpt: z.string().min(1).max(400),
  content: z.string().min(1).max(120000),
  coverImage: z.string().max(500).optional().nullable(),
  author: z.string().min(1).max(80).default('donot.'),
  tags: z.array(z.string().max(40)).default([]),
  seoTitle: z.string().max(160).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  ogImage: z.string().max(500).optional().nullable(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(),
})

export type DroopInput = z.infer<typeof droopSchema>
export type FlavorInput = z.infer<typeof flavorSchema>
export type BoxInput = z.infer<typeof boxSchema>
export type CouponInput = z.infer<typeof couponSchema>
export type CoverageZoneInput = z.infer<typeof coverageZoneSchema>
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>
