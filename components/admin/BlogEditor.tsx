'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Save, ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react'
import type { BlogPost } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { blogTags, slugify, readingTimeMin } from '@/lib/blog'
import { cn } from '@/lib/utils'

interface Props {
  post: BlogPost | null
}

interface Draft {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  author: string
  tagsRaw: string
  seoTitle: string
  seoDescription: string
  ogImage: string
  isPublished: boolean
}

const EMPTY: Draft = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: 'donot.',
  tagsRaw: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  isPublished: false,
}

function postToDraft(p: BlogPost): Draft {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    coverImage: p.coverImage ?? '',
    author: p.author,
    tagsRaw: blogTags(p.tags).join(', '),
    seoTitle: p.seoTitle ?? '',
    seoDescription: p.seoDescription ?? '',
    ogImage: p.ogImage ?? '',
    isPublished: p.isPublished,
  }
}

export function BlogEditor({ post }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(post ? postToDraft(post) : EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'edit' | 'preview' | 'split'>('split')

  const tags = draft.tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  async function save() {
    setSubmitting(true)
    setError(null)
    const body = {
      ...draft,
      tags,
      slug: draft.slug || slugify(draft.title),
      coverImage: draft.coverImage || null,
      seoTitle: draft.seoTitle || null,
      seoDescription: draft.seoDescription || null,
      ogImage: draft.ogImage || null,
    }
    try {
      const res = await fetch(
        post ? `/api/admin/blog/${post.id}` : '/api/admin/blog',
        {
          method: post ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos guardar.')
        return
      }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    if (!post) return
    if (!window.confirm('¿Borrar este post?')) return
    const res = await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin/blog')
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="text-donot-muted hover:text-donot-verde inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-xs">
            {(['edit', 'split', 'preview'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-full',
                  view === v
                    ? 'bg-donot-verde text-donot-crema'
                    : 'bg-white border border-donot-border text-donot-verde',
                )}
              >
                {v === 'edit' ? 'Editor' : v === 'split' ? 'Split' : 'Preview'}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => setDraft({ ...draft, isPublished: !draft.isPublished })}
            variant="secondary"
          >
            <span className="inline-flex items-center gap-2">
              {draft.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
              {draft.isPublished ? 'Publicado' : 'Borrador'}
            </span>
          </Button>
          <Button onClick={save} disabled={submitting}>
            <span className="inline-flex items-center gap-2">
              <Save size={16} />
              {submitting ? 'Guardando…' : 'Guardar'}
            </span>
          </Button>
          {post && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10"
              aria-label="Borrar post"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {error && <p className="text-sm text-donot-naranjo">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => {
              setDraft((d) => ({
                ...d,
                title: e.target.value,
                slug: d.slug || slugify(e.target.value),
              }))
            }}
            placeholder="Título"
            className="w-full px-4 py-3 text-2xl font-display text-donot-verde bg-transparent border-b-2 border-donot-border focus:outline-none focus:border-donot-verde"
          />

          <input
            type="text"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            placeholder="slug-del-post"
            className="px-3 py-2 rounded-xl border border-donot-border bg-white text-sm font-mono text-donot-muted"
          />

          <textarea
            value={draft.excerpt}
            onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            placeholder="Bajada / excerpt (160-300 caracteres ideal)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-donot-border bg-white text-sm resize-none focus:outline-none focus:border-donot-verde"
          />

          <div
            className={cn(
              'grid gap-3',
              view === 'split' ? 'md:grid-cols-2' : 'grid-cols-1',
            )}
          >
            {view !== 'preview' && (
              <textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="Contenido (Markdown soportado: **negrita**, [links](url), # títulos, listas, etc.)"
                rows={view === 'split' ? 24 : 32}
                className="w-full px-3 py-2 rounded-xl border border-donot-border bg-white font-mono text-sm focus:outline-none focus:border-donot-verde"
              />
            )}
            {view !== 'edit' && (
              <article className="border border-donot-border rounded-xl bg-white p-5 prose prose-sm max-w-none overflow-auto" style={{ minHeight: 400 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {draft.content || '_Vista previa del post — empezá a escribir a la izquierda._'}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <Section title="Cover image">
            <ImageUploader
              label=""
              value={draft.coverImage}
              onChange={(url) => setDraft({ ...draft, coverImage: url })}
            />
          </Section>

          <Section title="Meta">
            <Field label="Autor">
              <input
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Tags (separados por coma)">
              <input
                value={draft.tagsRaw}
                onChange={(e) => setDraft({ ...draft, tagsRaw: e.target.value })}
                className={inputClass}
                placeholder="apertura, sabores, recetas"
              />
            </Field>
            {draft.content && (
              <p className="text-xs text-donot-muted">
                ~{readingTimeMin(draft.content)} min de lectura · {draft.content.length} caracteres
              </p>
            )}
          </Section>

          <Section title="SEO (opcional, completa con valores por defecto)">
            <Field label="SEO title">
              <input
                value={draft.seoTitle}
                onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })}
                placeholder={draft.title || 'Por defecto usa el título'}
                className={inputClass}
              />
            </Field>
            <Field label="SEO description">
              <textarea
                value={draft.seoDescription}
                onChange={(e) => setDraft({ ...draft, seoDescription: e.target.value })}
                placeholder={draft.excerpt || 'Por defecto usa la bajada'}
                rows={3}
                className={cn(inputClass, 'resize-none')}
              />
            </Field>
            <ImageUploader
              label="OG Image (opcional, default cover)"
              value={draft.ogImage}
              onChange={(url) => setDraft({ ...draft, ogImage: url })}
            />
          </Section>
        </aside>
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-donot-border rounded-2xl p-4 flex flex-col gap-3">
      <h3 className="font-display text-sm text-donot-verde uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-donot-verde">{label}</span>
      {children}
    </label>
  )
}
