import Header from '../components/header'
import ExtLink from '../components/ext-link'
import Features from '../components/features'
import sharedStyles from '../styles/shared.module.css'

export default function Index() {
  return (
    <>
      <Header titlePre="Home" />
      <div className={sharedStyles.layout}>
        <img src="/clog criativo.png" width="400" alt="Clog Criativo" />
        <h2>Conhecimento nunca é demais. </h2>

        <div className="explanation">
          <p>
            {' '}
            Aqui, você encontra ideias, reflexões e soluções que unem
            criatividade e resultado. Um espaço para quem quer vender no digital
            com mais clareza, consistência e personalidade.
          </p>
          <div style={{ height: '20px' }}></div>
          <p>
            Esse espaço nasceu para compartilhar o que aprendo e aplico
            diariamente com marcas reais: estratégias que funcionam, design que
            vende e marketing que respeita o tempo (e o bolso) de quem está do
            outro lado.
          </p>
        </div>
      </div>
    </>
  )
}
