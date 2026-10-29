import Seo from '../components/Seo'
import sharedStyles from '../styles/shared.module.css'
import contactStyles from '../styles/contact.module.css'
import Insta from '../components/svgs/insta'
import Envelope from '../components/svgs/envelope'
import LinkedIn from '../components/svgs/linkedin'
import site from '../../site.config'

const contacts = [
  { Comp: Insta, alt: 'Instagram', link: site.social.instagram },
  { Comp: LinkedIn, alt: 'LinkedIn', link: site.social.linkedin },
  { Comp: Envelope, alt: 'E-mail', link: `mailto:${site.social.email}` },
]

export default function Contact() {
  return (
    <>
      <Seo title="Contato" path="/contato" description="Fale com a Joyce Aniceto, da Cria.Joy: Instagram, LinkedIn e e-mail." />
      <div className={sharedStyles.layout}>
        <div className={contactStyles.avatar}>
          <img src="/joy.png" alt="Logo Cria.Joy" height={120} />
        </div>

        <h1 style={{ marginTop: 0 }}>Contato</h1>

        <div className={contactStyles.name}>
          Joyce Aniceto @
          <a
            href={`${site.social.criajoy}?utm_source=clogblog&utm_medium=contato&utm_campaign=blog`}
            target="_blank"
            rel="noopener"
          >
            Cria.Joy
          </a>
        </div>

        <div className={contactStyles.links}>
          {contacts.map(({ Comp, link, alt }) => (
            <a key={link} href={link} target="_blank" rel="noopener" aria-label={alt}>
              <Comp height={32} />
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
