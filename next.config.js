/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Endereços do blog antigo → novos
      { source: '/blog/page/1', destination: '/blog', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        // Mídia baixada do Notion: nome do arquivo muda se o conteúdo mudar, pode ficar em cache por 1 ano
        source: '/notion-assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Content-Type', value: 'application/xml; charset=utf-8' }],
      },
    ]
  },
}
