import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { blogTags, readingTimeMin } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog · donot.',
  description: 'Historias, recetas y novedades de la cocina de donot.',
}

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, deletedAt: null, publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  return (
    <section className="px-6 md:px-10 py-12 md:py-16 max-w-6xl mx-auto">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-3">
          Lo que escribimos.
        </h1>
        <p className="text-donot-muted text-lg">
          Recetas, sabores nuevos, gente del local. Todo desde la cocina.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-donot-muted text-center py-16">
          Pronto tendremos historias acá.
        </p>
      ) : (
        <ul className="grid md:grid-cols-2 gap-8">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="group block">
                {p.coverImage && (
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-donot-rowAlt mb-4">
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  {blogTags(p.tags).slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-full bg-donot-rosado/20 text-donot-verde font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-donot-verde mb-2 group-hover:text-donot-naranjo transition">
                  {p.title}
                </h2>
                <p className="text-donot-ink leading-relaxed mb-2 line-clamp-3">
                  {p.excerpt}
                </p>
                <p className="text-donot-muted text-sm">
                  {p.author} ·{' '}
                  {p.publishedAt &&
                    new Intl.DateTimeFormat('es-CL', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }).format(p.publishedAt)}
                  {' · '}
                  {readingTimeMin(p.content)} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
