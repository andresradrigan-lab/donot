import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit3 } from 'lucide-react'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { blogTags } from '@/lib/blog'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  })

  const drafts = posts.filter((p) => !p.isPublished)
  const published = posts.filter((p) => p.isPublished)

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
            Blog
          </h1>
          <p className="text-donot-muted">
            {published.length} publicados · {drafts.length} borradores
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="lg">
            <span className="inline-flex items-center gap-2">
              <Plus size={16} /> Nuevo post
            </span>
          </Button>
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="bg-white border border-donot-border rounded-3xl p-12 text-center">
          <p className="text-donot-muted">
            Aún no hay posts. Empezá con el primero.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className={cn(
                'bg-white border border-donot-border rounded-2xl shadow-soft overflow-hidden flex',
                !p.isPublished && 'opacity-70',
              )}
            >
              <div className="relative w-32 h-32 shrink-0 bg-donot-rowAlt">
                {p.coverImage && (
                  <Image
                    src={p.coverImage}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-display text-lg text-donot-verde">
                      {p.title}
                    </h2>
                    {!p.isPublished && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                        Borrador
                      </span>
                    )}
                    {blogTags(p.tags).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full bg-donot-rosado/20 text-donot-verde"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-donot-muted text-sm line-clamp-2">{p.excerpt}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-donot-muted">
                    {p.author} ·{' '}
                    {p.publishedAt
                      ? new Intl.DateTimeFormat('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(p.publishedAt)
                      : 'sin publicar'}
                  </p>
                  <Link
                    href={`/admin/blog/${p.id}`}
                    className="inline-flex items-center gap-1 text-donot-naranjo font-semibold text-sm hover:underline"
                  >
                    <Edit3 size={14} /> Editar
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
