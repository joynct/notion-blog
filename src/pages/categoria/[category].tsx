import type { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import Seo from '../../components/Seo'
import PostList from '../../components/PostList'
import sharedStyles from '../../styles/shared.module.css'
import blogStyles from '../../styles/blog.module.css'
import { getAllPosts, getCategories } from '../../lib/content'
import type { Category, PostMeta } from '../../lib/types'

type Props = { category: Category; posts: PostMeta[] }

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getCategories().map((c) => ({ params: { category: c.slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.category)
  const category = getCategories().find((c) => c.slug === slug)
  if (!category) return { notFound: true }
  const posts = getAllPosts().filter((p) => p.categories.some((c) => c.slug === slug))
  return { props: { category, posts } }
}

export default function CategoryPage({ category, posts }: Props) {
  return (
    <>
      <Seo
        title={`Categoria: ${category.name}`}
        path={`/categoria/${category.slug}`}
        description={`Posts do Clog Criativo sobre ${category.name}.`}
      />
      <div className={`${sharedStyles.layout} ${blogStyles.blogIndex}`}>
        <h1>{category.name}</h1>
        <p className={blogStyles.categoryCount}>
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} nesta categoria ·{' '}
          <Link href="/blog">ver todos os posts</Link>
        </p>
        <PostList posts={posts} />
      </div>
    </>
  )
}
