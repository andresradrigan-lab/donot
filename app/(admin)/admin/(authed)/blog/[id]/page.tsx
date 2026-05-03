import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { BlogEditor } from '@/components/admin/BlogEditor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Editar post · admin donot.',
  robots: { index: false, follow: false },
}

interface Props {
  params: { id: string }
}

export default async function AdminBlogEditPage({ params }: Props) {
  // /admin/blog/new → editor en blanco
  if (params.id === 'new') {
    return (
      <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
        <BlogEditor post={null} />
      </section>
    )
  }

  const post = await prisma.blogPost.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!post) notFound()

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <BlogEditor post={post} />
    </section>
  )
}
