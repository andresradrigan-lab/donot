import type { BlogPost } from '@prisma/client'

/**
 * Devuelve el array de tags parseado desde la columna Json.
 */
export function blogTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((t): t is string => typeof t === 'string' && t.length > 0)
}

/**
 * Calcula tiempo estimado de lectura en minutos basado en ~200 palabras/min.
 */
export function readingTimeMin(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/**
 * Saca un slug seguro a partir de un título.
 * "Hola Mundo!" → "hola-mundo"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Resuelve los meta SEO con fallbacks: si seoTitle vacío usa title, etc.
 */
export function blogPostSeo(post: BlogPost): {
  title: string
  description: string
  image: string | null
} {
  return {
    title: post.seoTitle?.trim() || post.title,
    description: post.seoDescription?.trim() || post.excerpt,
    image: post.ogImage?.trim() || post.coverImage || null,
  }
}
