import Link from 'next/link'
import Seo from '../components/Seo'
import sharedStyles from '../styles/shared.module.css'

export default function NotFound() {
  return (
    <>
      <Seo title="Página não encontrada" path="/404" noindex />
      <div className={sharedStyles.layout}>
        <h1>Ops! Página não encontrada.</h1>
        <p style={{ textAlign: 'center' }}>
          Esse conteúdo pode ter mudado de endereço. <Link href="/blog">Ver todos os posts →</Link>
        </p>
      </div>
    </>
  )
}
