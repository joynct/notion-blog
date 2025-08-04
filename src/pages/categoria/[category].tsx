import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/header'
import blogStyles from '../../styles/blog.module.css'
import sharedStyles from '../../styles/shared.module.css'
import {
  getBlogLink,
  getDateStr,
  postIsPublished,
} from '../../lib/blog-helpers'
import { textBlock } from '../../lib/notion/renderers'
import getBlogIndex from '../../lib/notion/getBlogIndex'
import getNotionUsers from '../../lib/notion/getNotionUsers'

// Autor na prévia do post
const authorNames = {
  'b95499c4-31c9-4209-9bd8-644868be31fa': 'Joy',
  // Adicione outros autores se necessário
}

export const getStaticProps: GetStaticProps = async ({ params, preview }) => {
  const postsTable = await getBlogIndex()
  const category = params?.category as string

  const allPosts = Object.keys(postsTable).map((slug) => postsTable[slug])

  const filteredPosts = allPosts
    .filter((post) => {
      // Como as categorias já são strings (processadas no getBlogIndex), use diretamente
      return (
        post.Category?.includes(category) && (!preview || postIsPublished(post))
      )
    })
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())

  // Mapeia os autores
  filteredPosts.forEach((post) => {
    post.Authors = post.Authors?.map((id) => authorNames[id] || id) || []
  })

  return {
    props: {
      preview: preview || false,
      posts: filteredPosts,
      category,
    },
    revalidate: 10,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const postsTable = await getBlogIndex()
  const categories = new Set<string>()

  Object.keys(postsTable).forEach((slug) => {
    const post = postsTable[slug]
    if (postIsPublished(post) && post.Category) {
      if (Array.isArray(post.Category)) {
        post.Category.forEach((cat) => categories.add(cat))
      } else {
        categories.add(post.Category as string)
      }
    }
  })

  const paths = Array.from(categories).map((category) => ({
    params: { category },
  }))

  return {
    paths,
    fallback: true,
  }
}

const CategoryPage = ({ posts = [], preview, category }) => {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return (
    <>
      <Header titlePre={`Categoria: ${category}`} />
      {preview && (
        <div className={blogStyles.previewAlertContainer}>
          <div className={blogStyles.previewAlert}>
            <b>Note:</b>
            {` `}Viewing in preview mode{' '}
            <Link href={`/api/clear-preview`}>
              <button className={blogStyles.escapePreview}>Exit Preview</button>
            </Link>
          </div>
        </div>
      )}
      <div className={`${sharedStyles.layout} ${blogStyles.blogIndex}`}>
        <h1>Categoria: {category}</h1>
        {posts.length === 0 && (
          <p className={blogStyles.noPosts}>Não há posts nesta categoria.</p>
        )}
        {posts.map((post) => {
          return (
            <div className={blogStyles.postPreview} key={post.Slug}>
              <h3>
                <span className={blogStyles.titleContainer}>
                  {!post.Published && (
                    <span className={blogStyles.draftBadge}>Draft</span>
                  )}
                  <Link href="/blog/[slug]" as={getBlogLink(post.Slug)}>
                    <a>{post.Page}</a>
                  </Link>
                </span>
              </h3>
              {post.Authors?.length > 0 && (
                <div className="authors">Por: {post.Authors.join(' ')}</div>
              )}
              {post.Date && (
                <div className="posted">
                  Publicado em: {getDateStr(post.Date)}
                </div>
              )}
              <p>
                {(!post.preview || post.preview.length === 0) &&
                  'No preview available'}
                {(post.preview || []).map((block, idx) =>
                  textBlock(block, true, `${post.Slug}${idx}`)
                )}
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default CategoryPage
