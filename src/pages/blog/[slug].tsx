import type { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect } from 'react'
import Seo from '../../components/Seo'
import NotionBlocks from '../../components/NotionRenderer'
import blogStyles from '../../styles/blog.module.css'
import { getAllPosts, getPost } from '../../lib/content'
import { prerenderBlocks } from '../../lib/prerender'
import { formatDate, isoDate } from '../../lib/format'
import type { Block, Post, PostMeta } from '../../lib/types'
import site from '../../../site.config'

type Props = {
  post: Post
  newer: Pick<PostMeta, 'slug' | 'title'> | null
  older: Pick<PostMeta, 'slug' | 'title'> | null
  hasTweet: boolean
}

// Todas as páginas de posts são geradas no build. Nada de "Loading...":
// o Google recebe o HTML completo. Post que não existe = 404 de verdade.
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllPosts().map((p) => ({ params: { slug: p.slug } })),
  fallback: false,
})

const hasTwitter = (blocks: Block[]): boolean =>
  blocks.some(
    (b) =>
      (!!b.url && /^https?:\/\/(www\.)?(twitter|x)\.com\/.+\/status\//.test(b.url) && b.type !== 'bookmark') ||
      (!!b.children && hasTwitter(b.children))
  )

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug)
  const post = getPost(slug)
  if (!post) return { notFound: true }
  prerenderBlocks(post.blocks)

  const all = getAllPosts()
  const idx = all.findIndex((p) => p.slug === slug)
  const pick = (p?: PostMeta) => (p ? { slug: p.slug, title: p.title } : null)

  return {
    props: {
      post,
      newer: pick(all[idx - 1]),
      older: pick(all[idx + 1]),
      hasTweet: hasTwitter(post.blocks),
    },
  }
}

export default function PostPage({ post, newer, older, hasTweet }: Props) {
  const url = `${site.siteUrl}/blog/${post.slug}`

  // Ao navegar de um post para outro sem recarregar, reativa os botões de compartilhar e os tweets.
  useEffect(() => {
    const w = window as any
    w.a2a?.init_all?.()
    if (hasTweet) w.twttr?.widgets?.load?.()
  }, [post.slug, hasTweet])

  return (
    <>
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        image={post.cover}
        type="article"
        article={{
          published: isoDate(post.date),
          modified: post.updated,
          authors: post.authors,
          tags: post.categories.map((c) => c.name),
        }}
      />

      <article className={blogStyles.post}>
        <h1>{post.title}</h1>
        {post.authors.length > 0 && <div className="authors">Por: {post.authors.join(', ')}</div>}
        {post.date && (
          <div className="posted">
            Publicado em <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>
        )}
        {post.categories.length > 0 && (
          <div className={blogStyles.categoryList}>
            {post.categories.map((c) => (
              <Link key={c.slug} href={`/categoria/${c.slug}`} className={blogStyles.category}>
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <hr />

        <ShareButtons title={post.title} url={url} />

        <div className={blogStyles.postBody}>
          <NotionBlocks blocks={post.blocks} postTitle={post.title} />
        </div>

        <hr />
        <ShareButtons title={post.title} url={url} />

        {(newer || older) && (
          <nav className={blogStyles.postNav} aria-label="Outros posts">
            {older ? (
              <Link href={`/blog/${older.slug}`}>
                <small>← Anterior</small>
                <span>{older.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link href={`/blog/${newer.slug}`} className={blogStyles.postNavNext}>
                <small>Próximo →</small>
                <span>{newer.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </article>

      <Script src="https://static.addtoany.com/menu/page.js" strategy="lazyOnload" />
      {hasTweet && <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />}
    </>
  )
}

// Botões de compartilhamento (AddToAny), com links normais como reserva caso o script não carregue.
function ShareButtons({ title, url }: { title: string; url: string }) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  return (
    <div className={`a2a_kit a2a_kit_size_32 a2a_default_style ${blogStyles.share}`} data-a2a-url={url} data-a2a-title={title}>
      <a className="a2a_button_whatsapp" href={`https://api.whatsapp.com/send?text=${t}%20${u}`} target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp" />
      <a className="a2a_button_linkedin" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener" aria-label="Compartilhar no LinkedIn" />
      <a className="a2a_button_facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener" aria-label="Compartilhar no Facebook" />
      <a className="a2a_button_x" href={`https://x.com/intent/post?url=${u}&text=${t}`} target="_blank" rel="noopener" aria-label="Compartilhar no X" />
      <a className="a2a_button_email" href={`mailto:?subject=${t}&body=${u}`} aria-label="Enviar por e-mail" />
      <a className="a2a_dd" href={`https://www.addtoany.com/share#url=${u}&title=${t}`} aria-label="Mais opções de compartilhamento" />
    </div>
  )
}
