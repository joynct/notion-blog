import Header from '../components/header'
import ExtLink from '../components/ext-link'

import sharedStyles from '../styles/shared.module.css'
import contactStyles from '../styles/contact.module.css'

import Insta from '../components/svgs/insta'
import Envelope from '../components/svgs/envelope'
import LinkedIn from '../components/svgs/linkedin'

const contacts = [
  {
    Comp: Insta,
    alt: 'instagram icon',
    link: 'https:/instagram.com/cria.joy',
  },
  {
    Comp: LinkedIn,
    alt: 'linkedin icon',
    link: 'https://www.linkedin.com/in/criajoy/',
  },
  {
    Comp: Envelope,
    alt: 'email icon',
    link: 'mailto:joyceaniceto@gmail.com',
  },
]

export default function Contact() {
  return (
    <>
      <Header titlePre="Contato" />
      <div className={sharedStyles.layout}>
        <div className={contactStyles.avatar}>
          <img src="/joy.png" alt="logo criajoy" height={60} />
        </div>

        <h1 style={{ marginTop: 0 }}>Contato</h1>

        <div className={contactStyles.name}>
          Joyce Aniceto @ <ExtLink href="criajoy.netlify.app">Cria.Joy</ExtLink>
        </div>

        <div className={contactStyles.links}>
          {contacts.map(({ Comp, link, alt }) => {
            return (
              <ExtLink key={link} href={link} aria-label={alt}>
                <Comp height={32} />
              </ExtLink>
            )
          })}
        </div>
      </div>
    </>
  )
}
