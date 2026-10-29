import Link from 'next/link'
import React from 'react'
import blogStyles from '../styles/blog.module.css'
import { formatDate } from '../lib/format'
import type { PostMeta } from '../lib/types'

export default function PostList({ posts }: { posts: PostMeta[] }) {
  if (!posts.length) return <p className={blogStyles.noPosts}>Ainda não há posts por aqui.</p>
  return (
    <>
      {posts.map((post) => (
        <article className={blogStyles.postPreview} key={post.slug}>
          <h2 className={blogStyles.previewTitle}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
          {post.authors.length > 0 && <div className="authors">Por: {post.authors.join(', ')}</div>}
          {post.date && (
            <div className="posted">
              Publicado em: <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
          )}
          {post.categories.length > 0 && (
            <div className="category">
              <span>Categoria: </span>
              {post.categories.map((cat, index) => (
                <React.Fragment key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`}>{cat.name}</Link>
                  {index < post.categories.length - 1 && ', '}
                </React.Fragment>
              ))}
            </div>
          )}
          {post.description && <p>{post.description}</p>}
          <p className={blogStyles.readMore}>
            <Link href={`/blog/${post.slug}`} aria-label={`Ler "${post.title}"`}>
              Continuar lendo →
            </Link>
          </p>
        </article>
      ))}
    </>
  )
}
