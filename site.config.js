// Configurações gerais do site. Edite aqui nome, URL, textos e redes sociais.
// (CommonJS para poder ser lido tanto pelo Next.js quanto pelo script de sincronização.)

const siteUrl = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://clogcriativo.vercel.app'
).replace(/\/+$/, '')

module.exports = {
  siteUrl,
  name: 'Clog Criativo',
  shortName: 'Clog',
  description:
    'CLOG: o blog do criativo. Ideias, notícias, reflexões e soluções para quem quer crescer no marketing digital. By Cria.Joy',
  locale: 'pt_BR',
  lang: 'pt-BR',
  defaultImage: '/og-image.png',
  author: 'Joyce Aniceto',
  googleAnalyticsId: 'G-RRPGN34V24',
  postsPerPage: 10,

  // Nomes exibidos para autores do Notion (id do usuário -> nome).
  // Só é usado se a integração não tiver permissão para ler o nome do usuário.
  authorNames: {
    'b95499c4-31c9-4209-9bd8-644868be31fa': 'Joyce Aniceto',
  },

  social: {
    instagram: 'https://instagram.com/cria.joy',
    linkedin: 'https://www.linkedin.com/in/criajoy/',
    email: 'joyceaniceto@gmail.com',
    criajoy: 'https://criajoy.com.br/',
  },
}
