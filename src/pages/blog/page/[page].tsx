import Link from 'next/link'
import Header from '../../../components/header'
import React from 'react'
import blogStyles from '../../../styles/blog.module.css'
import sharedStyles from '../../../styles/shared.module.css'
import SearchBar from '../../../components/SearchBar'
import {
  getBlogLink,
  getDateStr,
  postIsPublished,
} from '../../../lib/blog-helpers'
import { textBlock } from '../../../lib/notion/renderers'
import getNotionUsers from '../../../lib/notion/getNotionUsers'
import getBlogIndex from '../../../lib/notion/getBlogIndex'

const postsPerPage = 10 // Limite de posts por página

const authorNames = {
  'b95499c4-31c9-4209-9bd8-644868be31fa': 'Joyce Aniceto',
  // Adicione outros autores se necessário
}

export async function getStaticPaths() {
  const postsTable = await getBlogIndex()
  const publishedPosts = Object.values(postsTable).filter(postIsPublished)
  const totalPages = Math.ceil(publishedPosts.length / postsPerPage)

  const paths = Array.from({ length: totalPages }, (_, i) => ({
    params: { page: (i + 1).toString() },
  }))

  return { paths, fallback: false }
}

export async function getStaticProps({ preview, params }) {
  const postsTable = await getBlogIndex()
  const currentPage = parseInt(params.page, 10)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage

  const authorsToGet: Set<string> = new Set()
  const allPosts = Object.keys(postsTable)
    .map((slug) => {
      const post = postsTable[slug]
      if (!preview && !postIsPublished(post)) {
        return null
      }
      post.Authors = post.Authors || []
      for (const author of post.Authors) {
        authorsToGet.add(author)
      }
      post.Category = post.Category || null
      return post
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())

  const posts = allPosts.slice(startIndex, endIndex)

  posts.map((post) => {
    post.Authors = post.Authors.map((id) => authorNames[id] || id)
  })

  return {
    props: {
      preview: preview || false,
      posts,
      currentPage,
      totalPages: Math.ceil(allPosts.length / postsPerPage),
    },
    revalidate: 300,
  }
}

const PaginatedIndex = ({ posts = [], preview, currentPage, totalPages }) => {
  return (
    <>
      <Header titlePre={`Página ${currentPage} - Blog`} />
      {preview && (
        <div className={blogStyles.previewAlertContainer}>
          <div className={blogStyles.previewAlert}>
            <b>Note:</b> Viewing in preview mode{' '}
            <Link href={`/api/clear-preview`}>
              <button className={blogStyles.escapePreview}>Exit Preview</button>
            </Link>
          </div>
        </div>
      )}
      <div className={`${sharedStyles.layout} ${blogStyles.blogIndex}`}>
        <img
          src="/clog criativo icone.png"
          height="85"
          width="250"
          alt="Clog Criativo ícone"
        />
        <h1>Clog Criativo</h1>
        <SearchBar posts={posts} />
        {posts.length === 0 && (
          <p className={blogStyles.noPosts}>There are no posts yet</p>
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
              {post.Authors.length > 0 && (
                <div className="authors">Por: {post.Authors.join(' ')}</div>
              )}
              {post.Date && (
                <div className="posted">
                  Publicado em: {getDateStr(post.Date)}
                </div>
              )}
              {post.Category &&
                Array.isArray(post.Category) &&
                post.Category.length > 0 && (
                  <div className="category">
                    <span>Categoria: </span>
                    {post.Category.map((cat, index) => (
                      <React.Fragment key={cat}>
                        <Link
                          href="/categoria/[category]"
                          as={`/categoria/${cat}`}
                        >
                          <a>{cat}</a>
                        </Link>
                        {index < post.Category.length - 1 && ', '}
                      </React.Fragment>
                    ))}
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

        <div className={blogStyles.pagination}>
          {currentPage > 1 && (
            <Link href={`/blog/page/${currentPage - 1}`}>
              <a>← Anterior</a>
            </Link>
          )}
          {currentPage < totalPages && (
            <Link href={`/blog/page/${currentPage + 1}`}>
              <a>Próximo →</a>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

export default PaginatedIndex
