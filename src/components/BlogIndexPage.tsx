import Link from 'next/link'
import Seo from './Seo'
import PostList from './PostList'
import SearchBar from './SearchBar'
import sharedStyles from '../styles/shared.module.css'
import blogStyles from '../styles/blog.module.css'
import type { Category, PostMeta } from '../lib/types'

export type BlogIndexProps = {
  posts: PostMeta[]
  currentPage: number
  totalPages: number
  categories: Category[]
}

const pageHref = (n: number) => (n <= 1 ? '/blog' : `/blog/page/${n}`)

export default function BlogIndexPage({ posts, currentPage, totalPages, categories }: BlogIndexProps) {
  return (
    <>
      <Seo
        title={currentPage > 1 ? `Blog: página ${currentPage}` : 'Blog'}
        path={pageHref(currentPage)}
        description="Todos os posts do Clog Criativo: marketing digital, design, criatividade e estratégias para vender no digital."
      />
      <div className={`${sharedStyles.layout} ${blogStyles.blogIndex}`}>
        <img src="/clog-criativo-icone.png" height={85} width={250} alt="" style={{ width: 250, height: 'auto' }} />
        <h1>Clog Criativo</h1>
        <SearchBar />

        {categories.length > 0 && (
          <nav className={blogStyles.categoryNav} aria-label="Categorias">
            {categories.map((c) => (
              <Link key={c.slug} href={`/categoria/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        <PostList posts={posts} />

        {totalPages > 1 && (
          <nav className={blogStyles.pagination} aria-label="Paginação">
            {currentPage > 1 ? <Link href={pageHref(currentPage - 1)}>← Anterior</Link> : <span />}
            <span>
              Página {currentPage} de {totalPages}
            </span>
            {currentPage < totalPages ? <Link href={pageHref(currentPage + 1)}>Próximo →</Link> : <span />}
          </nav>
        )}
      </div>
    </>
  )
}
