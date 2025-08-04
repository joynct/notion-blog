import Link from 'next/link'
import Header from '../../components/header'

import blogStyles from '../../styles/blog.module.css'
import sharedStyles from '../../styles/shared.module.css'

import SearchBar from '../../components/SearchBar'

import {
  getBlogLink,
  getDateStr,
  postIsPublished,
} from '../../lib/blog-helpers'
import { textBlock } from '../../lib/notion/renderers'
import getNotionUsers from '../../lib/notion/getNotionUsers'
import getBlogIndex from '../../lib/notion/getBlogIndex'

// Autor na prévia do post
const authorNames = {
  'b95499c4-31c9-4209-9bd8-644868be31fa': 'Joy',
  // Adicione outros autores se necessário
}

export async function getStaticProps({ preview }) {
  const postsTable = await getBlogIndex()

  const authorsToGet: Set<string> = new Set()
  const posts: any[] = Object.keys(postsTable)
    .map((slug) => {
      const post = postsTable[slug]
      // remove draft posts in production
      if (!preview && !postIsPublished(post)) {
        return null
      }
      post.Authors = post.Authors || []
      for (const author of post.Authors) {
        authorsToGet.add(author)
      }
      return post
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())

  // A linha abaixo busca os nomes do Notion, mas você quer usar o objeto 'authorNames'
  // const { users } = await getNotionUsers([...authorsToGet])

  posts.map((post) => {
    // A linha abaixo usa os nomes do Notion. Vamos substituí-la.
    // post.Authors = post.Authors.map((id) => users[id].full_name)

    // Nova lógica: Mapeia o ID do autor para o nome definido em 'authorNames'.
    // Se o ID não for encontrado, ele mantém o ID do Notion como fallback.
    post.Authors = post.Authors.map((id) => authorNames[id] || id)
  })

  return {
    props: {
      preview: preview || false,
      posts,
    },
    revalidate: 10,
  }
}

const Index = ({ posts = [], preview }) => {
  return (
    <>
      <Header titlePre="Blog" />
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

export default Index
