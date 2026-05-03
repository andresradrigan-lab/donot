import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { blogTags, readingTimeMin, blogPostSeo } from '@/lib/blog'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, isPublished: true, deletedAt: null },
  })
  if (!post) return { title: 'Post no encontrado · donot.' }

  const seo = blogPostSeo(post)
  const base = process.env.APP_URL ?? 'https://donot.cl'
  const url = `${base}/blog/${post.slug}`
  const ogImage = seo.image
    ? seo.image.startsWith('http')
      ? seo.image
      : `${base}${seo.image}`
    : undefined

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: seo.title,
      description: seo.description,
      url,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
      tags: blogTags(post.tags),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, isPublished: true, deletedAt: null },
  })
  if (!post) notFound()

  const seo = blogPostSeo(post)
  const base = process.env.APP_URL ?? 'https://donot.cl'
  const tags = blogTags(post.tags)

  // Posts relacionados (los 3 más recientes excluyendo este)
  const related = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      publishedAt: { not: null },
      NOT: { id: post.id },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: seo.description,
    image: seo.image
      ? seo.image.startsWith('http')
        ? seo.image
        : `${base}${seo.image}`
      : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'donot.',
      logo: {
        '@type': 'ImageObject',
        url: `${base}/brand/do-not-verde-horizontal.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}/blog/${post.slug}` },
    keywords: tags.length > 0 ? tags.join(', ') : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO con cover full-width */}
      {post.coverImage && (
        <section className="relative w-full">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-donot-verde overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none"
            />
          </div>
        </section>
      )}

      <article className="relative px-6 md:px-10 py-10 md:py-16 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-donot-muted hover:text-donot-verde mb-8 text-sm font-semibold transition"
        >
          <ArrowLeft size={16} /> Volver al blog
        </Link>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-donot-naranjo/10 text-donot-naranjo font-bold"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-4xl md:text-6xl text-donot-verde mb-6 leading-[1.05] tracking-[-0.01em]">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-donot-muted mb-10 pb-8 border-b-2 border-dashed border-donot-border">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-donot-verde text-donot-crema font-display text-sm">
              {post.author.charAt(0).toUpperCase()}
            </span>
            <span>
              Por <strong className="text-donot-verde">{post.author}</strong>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} className="text-donot-naranjo" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} className="text-donot-naranjo" />
            {readingTimeMin(post.content)} min de lectura
          </span>
        </div>

        {/* Excerpt como pull quote */}
        <p className="text-xl md:text-2xl text-donot-ink mb-10 leading-relaxed font-medium pl-5 border-l-4 border-donot-rosado">
          {post.excerpt}
        </p>

        {/* Markdown content con estilos donot */}
        <div
          className="
            text-donot-ink text-lg leading-[1.75]
            [&>p]:mb-5
            [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-7xl
            [&>p:first-of-type]:first-letter:text-donot-naranjo [&>p:first-of-type]:first-letter:float-left
            [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:leading-none
            [&>p:first-of-type]:first-letter:mt-1
            [&>h1]:font-display [&>h1]:text-3xl [&>h1]:md:text-4xl [&>h1]:text-donot-verde [&>h1]:mt-12 [&>h1]:mb-4 [&>h1]:leading-tight
            [&>h2]:font-display [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:text-donot-verde [&>h2]:mt-10 [&>h2]:mb-3 [&>h2]:leading-tight
            [&>h3]:font-display [&>h3]:text-xl [&>h3]:md:text-2xl [&>h3]:text-donot-verde [&>h3]:mt-8 [&>h3]:mb-2
            [&>strong]:text-donot-verde [&>strong]:font-bold
            [&>p>strong]:text-donot-verde [&>p>strong]:font-bold
            [&>p>em]:text-donot-naranjo [&>p>em]:font-medium
            [&>a]:text-donot-naranjo [&>a]:underline [&>a]:decoration-2 [&>a]:underline-offset-4 [&>a]:font-semibold hover:[&>a]:text-donot-rosado
            [&>p>a]:text-donot-naranjo [&>p>a]:underline [&>p>a]:decoration-2 [&>p>a]:underline-offset-4 [&>p>a]:font-semibold
            [&>ul]:my-5 [&>ul]:pl-6 [&>ul]:list-disc [&>ul]:space-y-1.5 [&>ul]:marker:text-donot-naranjo
            [&>ol]:my-5 [&>ol]:pl-6 [&>ol]:list-decimal [&>ol]:space-y-1.5 [&>ol]:marker:text-donot-naranjo [&>ol]:marker:font-display
            [&>blockquote]:my-8 [&>blockquote]:pl-6 [&>blockquote]:border-l-4 [&>blockquote]:border-donot-rosado [&>blockquote]:font-display [&>blockquote]:italic [&>blockquote]:text-2xl [&>blockquote]:text-donot-verde
            [&>img]:my-8 [&>img]:rounded-[2rem] [&>img]:w-full [&>img]:shadow-pop
            [&>hr]:my-12 [&>hr]:border-0 [&>hr]:h-px [&>hr]:bg-gradient-to-r [&>hr]:from-transparent [&>hr]:via-donot-border [&>hr]:to-transparent
            [&>code]:bg-donot-rowAlt [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
            [&>p>code]:bg-donot-rowAlt [&>p>code]:px-1.5 [&>p>code]:py-0.5 [&>p>code]:rounded [&>p>code]:text-sm [&>p>code]:font-mono
            [&>pre]:bg-donot-verde [&>pre]:text-donot-crema [&>pre]:p-5 [&>pre]:rounded-2xl [&>pre]:overflow-x-auto [&>pre]:my-6
          "
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer del artículo */}
        <div className="mt-16 pt-10 border-t-2 border-dashed border-donot-border">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Image
              src="/brand/mascota-azul-naranjo.png"
              alt=""
              width={70}
              height={88}
              className="h-20 w-auto"
            />
            <div>
              <p className="font-display italic text-2xl text-donot-naranjo leading-tight">
                ¿Te dieron ganas?
              </p>
              <p className="text-donot-muted text-sm">
                El drop activo está esperándote.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Link
              href="/droop/droop_001"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-donot-naranjo text-donot-crema font-bold hover:bg-donot-naranjo/90 transition shadow-pop"
            >
              Ver el drop activo <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </article>

      {/* Posts relacionados */}
      {related.length > 0 && (
        <section className="px-6 md:px-10 py-16 md:py-24 bg-donot-rowAlt">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-donot-rosado/15 text-donot-rosado text-xs font-bold uppercase tracking-[0.2em] mb-3">
                Más historias
              </span>
              <h2 className="font-display text-3xl md:text-5xl text-donot-verde leading-tight">
                Sigue leyendo.
              </h2>
            </div>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {related.map((p) => (
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
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col gap-2 flex-1">
                      <h3 className="font-display text-xl text-donot-verde leading-tight group-hover:text-donot-naranjo transition">
                        {p.title}
                      </h3>
                      <p className="text-donot-ink/70 text-sm leading-relaxed line-clamp-2">
                        {p.excerpt}
                      </p>
                      <div className="text-xs text-donot-muted pt-2 mt-auto">
                        {formatDate(p.publishedAt)} · {readingTimeMin(p.content)} min
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
  )
}
