import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { requireAdminApi } from '@/lib/auth/api'

export const dynamic = 'force-dynamic'

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * POST /api/admin/upload
 * multipart/form-data con campo "file". Guarda el archivo en
 * public/uploads/{uuid}{ext} y devuelve la URL pública servida por Next.
 *
 * En el futuro, si se configura Cloudinary, este endpoint puede delegar
 * sin tocar las páginas que lo consumen.
 */
export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, reason: 'Adjunta una imagen' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, reason: 'Archivo vacío' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, reason: 'Imagen mayor a 5 MB' }, { status: 400 })
  }

  const ext = extname(file.name).toLowerCase()
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ ok: false, reason: 'Formato no soportado' }, { status: 400 })
  }

  const filename = `${randomUUID()}${ext}`
  const dir = join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(dir, filename), buffer)

  return NextResponse.json({
    ok: true,
    url: `/uploads/${filename}`,
    name: file.name,
    sizeBytes: file.size,
  })
}
