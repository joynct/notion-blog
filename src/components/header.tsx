import Link from 'next/link'
import Head from 'next/head'
import ExtLink from './ext-link'
import { useRouter } from 'next/router'
import styles from '../styles/header.module.css'

const navItems: { label: string; page?: string; link?: string }[] = [
  { label: 'Home', page: '/' },
  { label: 'Blog', page: '/blog' },
  { label: 'Contato', page: '/contato' },
  {
    label: 'CriaJoy',
    link:
      'https://criajoy.netlify.app/?utm_source=clogblog&utm_medium=menu&utm_campaign=blog',
  },
]

const ogImageUrl = 'https://notion-blog.now.sh/og-image.png'

const Header = ({ titlePre = '' }) => {
  const { pathname } = useRouter()

  return (
    <header className={styles.header}>
      <Head>
        <title>{titlePre ? `${titlePre} |` : ''} Clog Criativo</title>
        <meta
          name="description"
          content="CLOG: O blog do criativo. Ideias, notícias, reflexões e soluções para quem quer crescer no marketing digital. By Cria.Joy"
        />
        <meta name="og:title" content="Clog Criativo" />
        <meta property="og:image" content="/clog criativo.png" />
      </Head>
      <ul>
        {navItems.map(({ label, page, link }) => (
          <li key={label}>
            {page ? (
              <Link href={page}>
                <a className={pathname === page ? 'active' : undefined}>
                  {label}
                </a>
              </Link>
            ) : (
              <ExtLink href={link}>{label}</ExtLink>
            )}
          </li>
        ))}
      </ul>
    </header>
  )
}

export default Header
