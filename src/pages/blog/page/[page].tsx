import type { GetStaticPaths, GetStaticProps } from 'next'
import BlogIndexPage, { BlogIndexProps } from '../../../components/BlogIndexPage'
import { getBlogPage, getTotalPages } from '../../../lib/pagination'

// A página 1 é /blog. Daqui saem /blog/page/2, /blog/page/3...
export const getStaticPaths: GetStaticPaths = async () => {
  const total = getTotalPages()
  const paths = Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({ params: { page: String(i + 2) } }))
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async ({ params }) => {
  const page = Number(params?.page)
  if (!Number.isInteger(page) || page < 2 || page > getTotalPages()) return { notFound: true }
  return { props: getBlogPage(page) }
}

export default function BlogPage(props: BlogIndexProps) {
  return <BlogIndexPage {...props} />
}
