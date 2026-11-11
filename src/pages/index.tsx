import Link from 'next/link'
import Seo from '../components/Seo'
import PostList from '../components/PostList'
import sharedStyles from '../styles/shared.module.css'
import blogStyles from '../styles/blog.module.css'
import { getAllPosts } from '../lib/content'
import type { PostMeta } from '../lib/types'
import site from '../../site.config'

export async function getStaticProps() {
  return { props: { latest: getAllPosts().slice(0, 3) } }
}

export default function Home({ latest }: { latest: PostMeta[] }) {
  return (
    <>
      <Seo path="/" />
      <div className={sharedStyles.layout}>
        <img src="/clog-criativo.png" width={400} height={400} alt="Clog Criativo" style={{ width: 400, height: 'auto' }} />
        <h1 className="visually-hidden">Clog Criativo</h1>
        <h2>Conhecimento nunca é demais.</h2>

        <div className="explanation">
          <p>
            Hellooo, aqui é a Joy. O Clog Criativo é onde eu escrevo sobre novidades no marketing digital e meus aprendizados por esse caminho tortuoso.
            Blog com C de Conhecimento, Criatividade e Cria.joy (minha marca!). Aqui você vai encontrar temas como redes sociais, site, SEO e design, entre ideias, reflexões e criatividade. 
          </p>
          <p>
            É para ler com calma! Num mundo dominado pela instantaneidade, esse é meu espaço contra a maré. Sabe aqueles sites repletos de anúncios, em que você mal
            consegue ler a matéria? Pois é, aqui é o oposto disso. Nada de vídeos piscando, clickbaits desnecessários ou promessas milagrosas. É explicação e diferenciação, direto ao ponto.
          </p>
          <p>Se você gostou, me segue no{' '}
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer">
              instagram (@cria.joy)
            </a>{' '}
            ou no{' '}
            <a href={site.social.twitter} target="_blank" rel="noopener noreferrer">
              X (@clogcriativo)
            </a>{' '}
            e acompanhe o blog pelo <a href="/rss.xml">RSS</a>. Dúvidas, feedbacks e/ou questionamentos, na página de contato tem mais formas de falar comigo.</p>
        </div>
      </div>

      {latest.length > 0 && (
        <section className={blogStyles.blogIndex} aria-labelledby="ultimos">
          <h2 id="ultimos" className={blogStyles.sectionTitle}>
            Últimos posts
          </h2>
          <PostList posts={latest} />
          <p className={blogStyles.seeAll}>
            <Link href="/blog">Ver todos os posts →</Link>
          </p>
        </section>
      )}
    </>
  )
}
