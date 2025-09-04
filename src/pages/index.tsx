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
            criatividade e resultado. Para quem quer vender no digital com mais
            clareza, consistência e personalidade, sem se perder no caos das
            redes sociais.
          </p>
          <div style={{ height: '20px' }}></div>
          <p>
            É para ler com calma! Num mundo dominado pela instantaneidade, aqui
            é um espaço contra a maré. Nada de vídeos chamativos, anúncios
            piscando ou click baits desnessários. Esse espaço nasceu para que eu
            possa compartilhar o que aprendo e aplico diariamente com marcas
            reais: estratégias que funcionam, design que vende e marketing que
            respeita o tempo (e o bolso) de quem está do outro lado.
          </p>
          <p>
            {' '}
            Se você gostou, me siga nas minhas redes sociais e deixe seu
            feedback.{' '}
          </p>
        </div>
      </div>
    </>
  )
}
