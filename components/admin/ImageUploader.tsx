'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export function ImageUploader({ value, onChange, label = 'Imagen', className }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos subir la imagen.')
        return
      }
      onChange(data.url)
    } catch {
      setError('Error de conexión al subir.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-sm font-semibold text-donot-verde">{label}</span>
      <div className="flex gap-3 items-start">
        <div
          className={cn(
            'relative w-24 h-24 rounded-xl bg-donot-rowAlt border border-donot-border overflow-hidden flex items-center justify-center shrink-0',
            !value && 'text-donot-muted',
          )}
        >
          {value ? (
            <Image src={value} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <Upload size={20} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… o pega URL externa"
            className="px-3 py-2 rounded-lg border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde"
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-donot-verde text-donot-crema text-sm font-semibold hover:bg-donot-verde/90 transition disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? 'Subiendo…' : 'Subir archivo'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-muted hover:text-donot-naranjo"
                aria-label="Limpiar imagen"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {error && <p className="text-xs text-donot-naranjo">{error}</p>}
        </div>
      </div>
    </div>
  )
}
