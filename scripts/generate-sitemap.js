const fs = require('fs')
const getBlogIndex = require('../src/lib/notion/getBlogIndex').default
const { getBlogLink, getCategoryLink } = require('../src/lib/blog-helpers')

;(async () => {
  const postsTable = await getBlogIndex()
  // ... gere o XML igual ao seu generateSitemap ...
  fs.writeFileSync('public/sitemap.xml', sitemap, 'utf8')
})()
