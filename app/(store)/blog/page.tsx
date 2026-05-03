import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/db'
import { blogTags, readingTimeMin } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog · donot.',
  description: 'Historias, recetas y novedades de la cocina de donot.',
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, deletedAt: null, publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  const [featured, ...rest] = posts

  return (
    <>
      {/* HERO */}
      <section className="relative px-6 md:px-10 pt-12 md:pt-16 pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-donot-rosado/15 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-donot-rosado/15 text-donot-rosado text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Diario de cocina
          </span>
          <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] text-donot-verde leading-[0.92] tracking-[-0.02em] mb-4">
            Lo que <span className="text-donot-naranjo">escribimos</span>.
          </h1>
          <p className="text-donot-muted text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Recetas, sabores nuevos, gente del local. Todo desde la cocina —
            sin filtros, sin pretensiones.
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="px-6 md:px-10 py-24 max-w-3xl mx-auto text-center">
          <Image
            src="/brand/mascota-crema-verde.png"
            alt=""
            width={120}
            height={150}
            className="h-32 w-auto mx-auto mb-6 opacity-60"
          />
          <p className="text-donot-muted text-lg">
            Pronto tendremos historias acá.
          </p>
        </section>
      ) : (
        <>
          {/* FEATURED POST */}
          {featured && (
            <section className="px-6 md:px-10 mb-16 md:mb-24">
              <div className="max-w-7xl mx-auto">
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center bg-white rounded-[2.5rem] border border-donot-border shadow-soft hover:shadow-pop transition-all duration-300 overflow-hidden p-6 md:p-8"
                >
                  {featured.coverImage && (
                    <div className="relative aspect-[4/3] md:aspect-square rounded-[2rem] overflow-hidden bg-donot-rowAlt -m-2 md:-m-4">
                      <Image
                        src={featured.coverImage}
                        alt={featured.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 inline-block px-3 py-1.5 rounded-full bg-donot-rosado text-donot-crema text-[10px] font-bold uppercase tracking-[0.2em] shadow-pop">
                        ★ Lo último
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-4 md:gap-5">
                    <div className="flex flex-wrap gap-2">
                      {blogTags(featured.tags).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-donot-naranjo/10 text-donot-naranjo font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-display text-3xl md:text-5xl text-donot-verde leading-[1.05] group-hover:text-donot-naranjo transition">
                      {featured.title}
                    </h2>
                    <p className="text-donot-ink/80 text-lg leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-donot-muted pt-2">
                      <span>
                        Por <strong className="text-donot-verde">{featured.author}</strong>
                      </span>
                      <span>·</span>
                      <span>{formatDate(featured.publishedAt)}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} /> {readingTimeMin(featured.content)} min
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-donot-naranjo font-bold mt-2 group-hover:gap-3 transition-all">
                      Leer historia <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* GRID DEL RESTO */}
          {rest.length > 0 && (
            <section className="px-6 md:px-10 pb-24">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                  <h2 className="font-display text-3xl md:text-4xl text-donot-verde leading-tight">
                    Más historias
                  </h2>
                  <p className="text-donot-muted text-sm">
                    {rest.length} {rest.length === 1 ? 'post' : 'posts'} más
                  </p>
                </div>

                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {rest.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/blog/${p.slug}`}
                        className="group flex flex-col h-full bg-white rounded-[1.75rem] border border-donot-border shadow-soft hover:shadow-pop hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      >
                        {p.coverImage && (
                          <div className="relative aspect-[4/3] bg-donot-rowAlt overflow-hidden">
                            <Image
                              src={p.coverImage}
                              alt={p.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="p-5 md:p-6 flex flex-col gap-3 flex-1">
                          <div className="flex flex-wrap gap-1.5">
                            {blogTags(p.tags).slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-donot-rosado/15 text-donot-rosado font-bold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <h3 className="font-display text-xl md:text-2xl text-donot-verde leading-tight group-hover:text-donot-naranjo transition">
                            {p.title}
                          </h3>
                          <p className="text-donot-ink/75 text-sm leading-relaxed line-clamp-2 flex-1">
                            {p.excerpt}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-donot-muted pt-2 border-t border-donot-border mt-auto">
                            <span>{formatDate(p.publishedAt)}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> {readingTimeMin(p.content)} min
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
