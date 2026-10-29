import Link from 'next/link'
import Seo from '../components/Seo'
import PostList from '../components/PostList'
import sharedStyles from '../styles/shared.module.css'
import blogStyles from '../styles/blog.module.css'
import { getAllPosts } from '../lib/content'
import type { PostMeta } from '../lib/types'

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
            Aqui, você encontra ideias, reflexões e soluções que unem criatividade e resultado. Para quem quer vender no
            digital com mais clareza, consistência e personalidade, sem se perder no caos das redes sociais.
          </p>
          <p>
            É para ler com calma! Num mundo dominado pela instantaneidade, aqui é um espaço contra a maré. Nada de vídeos
            chamativos, anúncios piscando ou click baits desnecessários. Esse espaço nasceu para que eu possa
            compartilhar o que aprendo e aplico diariamente com marcas reais: estratégias que funcionam, design que vende
            e marketing que respeita o tempo (e o bolso) de quem está do outro lado.
          </p>
          <p>Se você gostou, me siga nas minhas redes sociais e deixe seu feedback.</p>
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
