import blogStyles from '../styles/blog.module.css'
import site from '../../site.config'

// Bloco de contato exibido no fim de todos os posts.
// A mensagem do WhatsApp já vai com o título do post, para você saber de qual texto a pessoa veio.
export default function ContactBlock({ title }: { title: string }) {
  const msg = `Oi, Joy! Li o post "${title}" no Clog Criativo e queria conversar.`
  const whatsapp = `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(msg)}`

  return (
    <aside className={blogStyles.contactBlock} aria-label="Sobre a autora e contato">
      <img
        className={blogStyles.contactPhoto}
        src="/joy-contato-pequena.png"
        alt="Joyce Aniceto"
        width={96}
        height={96}
        loading="lazy"
      />
      <div className={blogStyles.contactContent}>
        <p className={blogStyles.contactTitle}>Oi, eu sou a Joyce!</p>
        <p className={blogStyles.contactText}>
          Escrevo o Clog Criativo e cuido do marketing e das redes de pequenos negócios na Cria.Joy.
          Se o post te deu uma ideia, uma dúvida ou vontade de trocar uma ideia, me chama no WhatsApp.
          Se o seu negócio precisar de uma mão, a gente conversa sobre isso também.
        </p>
        <a className={blogStyles.contactButton} href={whatsapp} target="_blank" rel="noopener noreferrer">
          Chamar no WhatsApp
        </a>
      </div>
    </aside>
  )
}
