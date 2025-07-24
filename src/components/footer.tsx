import ExtLink from './ext-link'

export default function Footer() {
  return (
    <>
      <footer>
        <span>Crie seu blog</span>
        <ExtLink href="https://vercel.com/new/git/external?repository-url=https://github.com/ijjk/notion-blog/tree/main&project-name=notion-blog&repository-name=notion-blog">
          <img
            src="https://vercel.com/button"
            height={46}
            width={132}
            alt="deploy to Vercel button"
          />
        </ExtLink>
        <span>
          <ExtLink href="https://criajoy.netlify.app/">
            {' '}
            2025 cria.joy. Todos os direitos reservados.
          </ExtLink>
        </span>
      </footer>
    </>
  )
}
