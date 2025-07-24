import Header from '../components/header'
import ExtLink from '../components/ext-link'
import Features from '../components/features'
import sharedStyles from '../styles/shared.module.css'

export default function Index() {
  return (
    <>
      <Header titlePre="Home" />
      <div className={sharedStyles.layout}>
        <img
          src="/vercel-and-notion.png"
          height="85"
          width="250"
          alt="Vercel + Notion"
        />
        <h1>Clog Criativo</h1>
        <h2>Conhecimento nunca é demais. </h2>

        <div className="explanation">
          <p>
            Aqui, você encontra ideias, reflexões e soluções que unem
            criatividade e resultado. Um espaço para quem quer vender no digital
            com mais clareza, consistência e personalidade. Conheça mais sobre o
            meu trabalho acessando por aqui{' '}
            <ExtLink href="https://criajoy.netlify.app/">criajoy</ExtLink>
          </p>
        </div>
      </div>
    </>
  )
}
