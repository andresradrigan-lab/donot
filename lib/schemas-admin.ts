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

export type DroopInput = z.infer<typeof droopSchema>
export type FlavorInput = z.infer<typeof flavorSchema>
export type BoxInput = z.infer<typeof boxSchema>
