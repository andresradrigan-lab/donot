'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trash2, ArrowUp, ArrowDown, Upload, Eye, EyeOff, Edit3, X, Check } from 'lucide-react'
import type { GalleryImage } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  images: GalleryImage[]
}

export function GalleryManager({ images: initial }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftCaption, setDraftCaption] = useState('')
  const [draftAlt, setDraftAlt] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function uploadFiles(files: FileList) {
    setUploading(true)
    setError(null)
    const baseSortOrder = images.reduce((m, i) => Math.max(m, i.sortOrder), 0) + 1

    let i = 0
    for (const file of Array.from(files)) {
      try {
        // 1. Subir a /api/admin/upload (devuelve URL)
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const up = await upRes.json()
        if (!upRes.ok || !up.ok) {
          setError(`Falló ${file.name}: ${up.reason ?? 'error'}`)
          continue
        }

        // 2. Crear el GalleryImage con esa URL
        const createRes = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: up.url,
            alt: file.name.replace(/\.[^.]+$/, ''),
            sortOrder: baseSortOrder + i,
            isPublished: true,
          }),
        })
        const created = await createRes.json()
        if (!createRes.ok || !created.ok) {
          setError(`Falló registrar ${file.name}`)
          continue
        }
        i++
      } catch {
        setError('Error de red al subir.')
      }
    }
    setUploading(false)
    router.refresh()
  }

  async function patch(id: string, data: Partial<GalleryImage>) {
    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const j = await res.json()
      setImages((arr) =>
        arr.map((it) => (it.id === id ? { ...it, ...j.image } : it)),
      )
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Borrar esta foto?')) return
    const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setImages((arr) => arr.filter((it) => it.id !== id))
    }
  }

  function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((it) => it.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= images.length) return
    const a = images[idx]
    const b = images[newIdx]
    patch(a.id, { sortOrder: b.sortOrder })
    patch(b.id, { sortOrder: a.sortOrder })
    const next = [...images]
    next[idx] = { ...b, sortOrder: a.sortOrder }
    next[newIdx] = { ...a, sortOrder: b.sortOrder }
    setImages(next)
  }

  function startEdit(img: GalleryImage) {
    setEditingId(img.id)
    setDraftCaption(img.caption ?? '')
    setDraftAlt(img.alt ?? '')
  }

  function saveEdit() {
    if (!editingId) return
    patch(editingId, { caption: draftCaption || null, alt: draftAlt || null } as Partial<GalleryImage>)
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="bg-white border border-donot-border rounded-3xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl text-donot-verde">
            Subir fotos
          </h2>
          <p className="text-donot-muted text-sm">
            Multiselección. Cada foto se guarda activa por defecto y se ordena al final.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              uploadFiles(e.target.files)
            }
            e.target.value = ''
          }}
        />
        <Button onClick={() => fileRef.current?.click()} size="lg" disabled={uploading}>
          <span className="inline-flex items-center gap-2">
            <Upload size={16} />
            {uploading ? 'Subiendo…' : 'Subir fotos'}
          </span>
        </Button>
      </header>

      {error && (
        <p className="px-4 py-3 rounded-xl bg-donot-naranjo/10 border border-donot-naranjo/30 text-donot-naranjo text-sm">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <div className="bg-white border border-donot-border rounded-3xl p-12 text-center text-donot-muted">
          Aún no hay fotos. Subí la primera con el botón de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <article
              key={img.id}
              className={cn(
                'bg-white border border-donot-border rounded-2xl overflow-hidden flex flex-col',
                !img.isPublished && 'opacity-60',
              )}
            >
              <div className="relative aspect-square bg-donot-rowAlt">
                <Image
                  src={img.imageUrl}
                  alt={img.alt ?? ''}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                {editingId === img.id ? (
                  <>
                    <input
                      type="text"
                      value={draftCaption}
                      onChange={(e) => setDraftCaption(e.target.value)}
                      placeholder="Caption"
                      className="px-2 py-1.5 rounded-lg border border-donot-border text-sm"
                    />
                    <input
                      type="text"
                      value={draftAlt}
                      onChange={(e) => setDraftAlt(e.target.value)}
                      placeholder="Texto alternativo (alt)"
                      className="px-2 py-1.5 rounded-lg border border-donot-border text-xs"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-donot-verde text-donot-crema text-xs font-semibold"
                      >
                        <Check size={12} /> Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1.5 rounded-lg border border-donot-border text-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-donot-ink line-clamp-2 min-h-[2.5em]">
                      {img.caption || <span className="text-donot-muted italic">sin caption</span>}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-auto">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => move(img.id, -1)}
                          disabled={idx === 0}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-donot-verde hover:bg-donot-verde/10 disabled:opacity-30"
                          aria-label="Subir"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(img.id, 1)}
                          disabled={idx === images.length - 1}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-donot-verde hover:bg-donot-verde/10 disabled:opacity-30"
                          aria-label="Bajar"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => patch(img.id, { isPublished: !img.isPublished })}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-donot-verde hover:bg-donot-verde/10"
                          aria-label={img.isPublished ? 'Despublicar' : 'Publicar'}
                        >
                          {img.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(img)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-donot-verde hover:bg-donot-verde/10"
                          aria-label="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(img.id)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10"
                          aria-label="Borrar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
