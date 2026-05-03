import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { blogTags, readingTimeMin, blogPostSeo } from '@/lib/blog'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
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

  // JSON-LD Article para SEO
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
        url: `${base}/brand/do-not-verde-fondo-crema.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}/blog/${post.slug}` },
    keywords: tags.length > 0 ? tags.join(', ') : undefined,
  }

  return (
    <article className="px-6 md:px-10 py-12 md:py-16 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-donot-muted hover:text-donot-verde mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Blog
      </Link>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded-full bg-donot-rosado/20 text-donot-verde font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-4 leading-tight">
        {post.title}
      </h1>

      <p className="text-donot-muted mb-8">
        {post.author} ·{' '}
        {post.publishedAt &&
          new Intl.DateTimeFormat('es-CL', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }).format(post.publishedAt)}
        {' · '}
        {readingTimeMin(post.content)} min de lectura
      </p>

      {post.coverImage && (
        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-donot-rowAlt mb-10">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <p className="text-xl text-donot-ink/85 mb-8 leading-relaxed font-medium">
        {post.excerpt}
      </p>

      <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-donot-verde prose-a:text-donot-naranjo prose-strong:text-donot-verde">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  )
}
