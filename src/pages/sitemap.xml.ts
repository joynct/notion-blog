import getBlogIndex from '../lib/notion/getBlogIndex'
import { getBlogLink, getCategoryLink } from '../lib/blog-helpers'

// Esta função gera o XML do sitemap
function generateSitemap(posts) {
  // Coletar as categorias únicas
  const allCategories = new Set()
  Object.values(posts).forEach((post: any) => {
    if (post.Category && Array.isArray(post.Category)) {
      post.Category.forEach((cat: string) => allCategories.add(cat))
    }
  })

  // URLs estáticas (página inicial, página do blog, etc.)
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://clogcriativo.com.br/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://clogcriativo.com.br/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`

  // URLs das publicações
  Object.values(posts).forEach((post: any) => {
    // Apenas posts publicados devem ir para o sitemap
    if (post.Published === 'Yes') {
      const postUrl = `https://clogcriativo.com.br${getBlogLink(post.Slug)}`
      sitemap += `  <url>
    <loc>${postUrl}</loc>
    <lastmod>${new Date(post.Date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
    }
  })

  // URLs das categorias
  allCategories.forEach((category: string) => {
    const categoryUrl = `https://clogcriativo.com.br${getCategoryLink(
      category
    )}`
    sitemap += `  <url>
    <loc>${categoryUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`
  })

  sitemap += `</urlset>`

  return sitemap
}

export async function getServerSideProps({ res }) {
  try {
    const postsTable = await getBlogIndex()
    const sitemap = generateSitemap(postsTable)

    res.setHeader('Content-Type', 'application/xml')
    res.write(sitemap)
    res.end()
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    res.statusCode = 500
    res.end('Error generating sitemap')
  }

  return { props: {} }
}

//componente fantasma, o sitemap é gerado diretamente pelo getServerSideProps
const Sitemap = () => null
export default Sitemap
