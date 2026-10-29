import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/header.module.css'
import site from '../../site.config'

const navItems: { label: string; page?: string; link?: string }[] = [
  { label: 'Home', page: '/' },
  { label: 'Blog', page: '/blog' },
  { label: 'Contato', page: '/contato' },
  {
    label: 'CriaJoy',
    link: `${site.social.criajoy}?utm_source=clogblog&utm_medium=menu&utm_campaign=blog`,
  },
]

export default function Header() {
  const { pathname } = useRouter()
  const isActive = (page: string) =>
    page === '/' ? pathname === '/' : pathname === page || pathname.startsWith(page + '/') || (page === '/blog' && pathname.startsWith('/categoria'))

  return (
    <header className={styles.header}>
      <nav aria-label="Menu principal">
        <ul>
          {navItems.map(({ label, page, link }) => (
            <li key={label}>
              {page ? (
                <Link href={page} className={isActive(page) ? 'active' : undefined}>
                  {label}
                </Link>
              ) : (
                <a href={link} target="_blank" rel="noopener">
                  {label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
