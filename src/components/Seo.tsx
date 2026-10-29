import Head from 'next/head'
import site from '../../site.config'

type SeoProps = {
  title?: string
  description?: string
  path: string // caminho da página, ex.: "/blog/meu-post"
  image?: string | null
  type?: 'website' | 'article'
  noindex?: boolean
  article?: {
    published: string
    modified?: string
    authors?: string[]
    tags?: string[]
  }
}

const absolute = (u: string) => (/^https?:\/\//.test(u) ? u : site.siteUrl + encodeURI(u))

// Título, descrição, URL canônica, Open Graph (WhatsApp/Facebook/LinkedIn),
// Twitter e dados estruturados (JSON-LD) para o Google entender cada página.
export default function Seo({ title, description, path, image, type = 'website', noindex, article }: SeoProps) {
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name}: o blog do criativo`
  const desc = (description || site.description).slice(0, 300)
  const url = site.siteUrl + (path === '/' ? '/' : path.replace(/\/+$/, ''))
  const img = absolute(image || site.defaultImage)

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: desc,
        image: [img],
        datePublished: article.published,
        dateModified: article.modified || article.published,
        author: (article.authors?.length ? article.authors : [site.author]).map((name) => ({
          '@type': 'Person',
          name,
        })),
        publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: absolute('/clog-criativo.png') } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        keywords: article.tags?.join(', '),
        inLanguage: 'pt-BR',
      }
    : path === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: site.name,
          url: site.siteUrl + '/',
          description: site.description,
          inLanguage: 'pt-BR',
        }
      : null

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:site_name" content={site.name} />
      <meta property="og:locale" content={site.locale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || site.name} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      {article && <meta property="article:published_time" content={article.published} />}
      {article?.modified && <meta property="article:modified_time" content={article.modified} />}
      {article?.tags?.map((t) => <meta key={t} property="article:tag" content={t} />)}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || site.name} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </Head>
  )
}
