import Link from 'next/link'
import blogStyles from '../styles/blog.module.css'
import site from '../../site.config'

// Bloco de contato exibido no fim de todos os posts.
// A mensagem do WhatsApp já vai com o título do post, para você saber de qual texto a pessoa veio.
export default function ContactBlock({ title }: { title: string }) {
  const msg = `Oi, Joy! Li o post "${title}" no Clog Criativo e queria conversar sobre isso.`
  const whatsapp = `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(msg)}`

  return (
    <aside className={blogStyles.contactBlock} aria-label="Contato">
      <p className={blogStyles.contactTitle}>Quer aplicar isso no seu negócio?</p>
      <p className={blogStyles.contactText}>
        Eu sou a Joyce, da Cria.Joy. Se ficou alguma dúvida ou se você quer ajuda para colocar isso em prática, me chama por aqui.
      </p>
      <div className={blogStyles.contactActions}>
        <a className={blogStyles.contactButton} href={whatsapp} target="_blank" rel="noopener noreferrer">
          Chamar no WhatsApp
        </a>
        <Link className={blogStyles.contactButtonAlt} href="/contato">
          Outras formas de contato
        </Link>
      </div>
    </aside>
  )
}
