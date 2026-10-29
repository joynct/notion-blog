import site from '../../site.config'

export default function Footer() {
  return (
    <footer>
      <span>
        <a
          href={`${site.social.criajoy}?utm_source=clogblog&utm_medium=rodape&utm_campaign=blog`}
          target="_blank"
          rel="noopener"
        >
          {new Date().getFullYear()} cria.joy. Todos os direitos reservados.
        </a>
      </span>
      {' · '}
      <span>
        <a href="/rss.xml">RSS</a>
      </span>
    </footer>
  )
}
