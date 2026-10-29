#!/usr/bin/env node
/**
 * Sincroniza o banco de dados do Notion com o site.
 *
 * Roda ANTES do `next build` (e do `next dev`). Ele:
 *   1. Lê os posts publicados do banco de dados do Notion (API oficial).
 *   2. Baixa o conteúdo de cada post (blocos) e todas as imagens/arquivos
 *      hospedados no Notion para public/notion-assets (os links do Notion
 *      expiram em ~1h; os nossos não expiram).
 *   3. Salva tudo em content/*.json, que as páginas usam para gerar HTML estático.
 *   4. Gera public/sitemap.xml, public/rss.xml, public/robots.txt e
 *      public/search-index.json.
 *
 * Se algo der errado, o script termina com erro e o build é interrompido.
 * Assim a Vercel mantém no ar a última versão boa, em vez de publicar um blog vazio.
 *
 * Variáveis de ambiente:
 *   NOTION_TOKEN        Token da integração interna do Notion (começa com "ntn_" ou "secret_")
 *   NOTION_DATABASE_ID  ID do banco de dados de posts (aceita também BLOG_INDEX_ID)
 *   SITE_URL            (opcional) URL pública do site, ex.: https://clogcriativo.vercel.app
 */

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import siteConfig from '../site.config.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_DIR = path.join(ROOT, 'content')
const POSTS_DIR = path.join(CONTENT_DIR, 'posts')
const PUBLIC_DIR = path.join(ROOT, 'public')
const ASSETS_DIR = path.join(PUBLIC_DIR, 'notion-assets')
const ASSETS_URL = '/notion-assets'

const API_BASE = (process.env.NOTION_API_BASE || 'https://api.notion.com/v1').replace(/\/+$/, '')
const NOTION_VERSION = '2022-06-28'
// Versão nova da API (bancos de dados com "fontes de dados", criados no Notion a partir de 2025)
const NEW_VERSION = '2025-09-03'

// ---------------------------------------------------------------------------
// Nomes aceitos para cada coluna do banco de dados (maiúsculas/minúsculas não importam).
// Se você renomear uma coluna no Notion, adicione o novo nome aqui.
// ---------------------------------------------------------------------------
const PROPS = {
  slug: ['Slug', 'URL', 'Link'],
  date: ['Date', 'Data', 'Data de publicação', 'Publicado em'],
  published: ['Published', 'Publicado', 'Status', 'Publicar'],
  authors: ['Authors', 'Author', 'Autor', 'Autores', 'Autora'],
  categories: ['Category', 'Categories', 'Categoria', 'Categorias', 'Tags'],
  description: ['Description', 'Descrição', 'Descricao', 'Resumo', 'Excerpt'],
  cover: ['Cover', 'Capa', 'Imagem', 'Image'],
}
// Valores que contam como "publicado" quando a coluna é Select/Status (e não Checkbox).
const PUBLISHED_VALUES = ['yes', 'sim', 'publicado', 'published', 'publicar', 'no ar', 'done', 'concluído']

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const log = (...a) => console.log('[notion]', ...a)
const warn = (...a) => console.warn('[notion] ⚠️ ', ...a)

class SyncError extends Error {}

function normalizeId(id) {
  if (!id) return id
  const clean = String(id).trim()
  // aceita a URL inteira do Notion também
  const m = clean.match(/([0-9a-f]{32})(?:\?|$)/i) || clean.replace(/-/g, '').match(/([0-9a-f]{32})/i)
  const hex = m ? m[1] : clean.replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/i.test(hex)) {
    throw new SyncError(`ID do Notion inválido: "${id}". Ele deve ter 32 caracteres (letras a-f e números).`)
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// O Notion permite ~3 requisições por segundo. Espaçamos as chamadas e
// repetimos automaticamente quando a API pede para esperar (429) ou oscila (5xx).
let lastCall = 0
async function notion(method, endpoint, body, version = NOTION_VERSION) {
  const token = process.env.NOTION_TOKEN
  for (let attempt = 1; ; attempt++) {
    const wait = lastCall + 340 - Date.now()
    if (wait > 0) await sleep(wait)
    lastCall = Date.now()

    let res
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': version,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      if (attempt < 5) {
        warn(`Falha de rede (${err.message}), tentando de novo...`)
        await sleep(1000 * attempt)
        continue
      }
      throw err
    }

    if (res.ok) return res.json()

    const retriable = res.status === 429 || res.status >= 500
    if (retriable && attempt < 6) {
      const retryAfter = Number(res.headers.get('retry-after')) || attempt * 1.5
      warn(`Notion respondeu ${res.status}, aguardando ${retryAfter}s...`)
      await sleep(retryAfter * 1000)
      continue
    }
    let detail = ''
    try {
      const j = await res.json()
      detail = j.message || JSON.stringify(j)
    } catch {
      detail = await res.text().catch(() => '')
    }
    const err = new Error(`Notion API ${res.status} em ${method} ${endpoint}: ${detail}`)
    err.status = res.status
    err.code = detail
    throw err
  }
}

async function paginate(method, endpoint, body = {}, version = NOTION_VERSION) {
  const results = []
  let cursor
  do {
    const page =
      method === 'GET'
        ? await notion('GET', `${endpoint}${endpoint.includes('?') ? '&' : '?'}page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`, null, version)
        : await notion('POST', endpoint, { ...body, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }, version)
    results.push(...page.results)
    cursor = page.has_more ? page.next_cursor : null
  } while (cursor)
  return results
}

// ---------------------------------------------------------------------------
// Leitura de propriedades
// ---------------------------------------------------------------------------
function findProp(properties, names) {
  const lower = Object.fromEntries(Object.entries(properties).map(([k, v]) => [k.trim().toLowerCase(), v]))
  for (const n of names) {
    const p = lower[n.toLowerCase()]
    if (p) return p
  }
  return null
}

const plain = (rich = []) => rich.map((r) => r.plain_text ?? r.text?.content ?? '').join('')

function propText(p) {
  if (!p) return ''
  switch (p.type) {
    case 'title':
      return plain(p.title)
    case 'rich_text':
      return plain(p.rich_text)
    case 'url':
      return p.url || ''
    case 'select':
      return p.select?.name || ''
    case 'status':
      return p.status?.name || ''
    case 'formula':
      return p.formula?.string ?? String(p.formula?.number ?? '')
    default:
      return ''
  }
}

function isPublished(p) {
  if (!p) return false
  if (p.type === 'checkbox') return p.checkbox === true
  if (p.type === 'formula' && p.formula?.type === 'boolean') return p.formula.boolean === true
  return PUBLISHED_VALUES.includes(propText(p).trim().toLowerCase())
}

function propList(p) {
  if (!p) return []
  if (p.type === 'multi_select') return p.multi_select.map((o) => o.name)
  if (p.type === 'select') return p.select ? [p.select.name] : []
  if (p.type === 'rich_text')
    return plain(p.rich_text)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  return []
}

function propPeople(p) {
  if (!p) return []
  if (p.type === 'people')
    return p.people.map((u) => u.name || siteConfig.authorNames[u.id] || siteConfig.author)
  if (p.type === 'created_by') return [p.created_by?.name || siteConfig.author]
  return propList(p)
}

// ---------------------------------------------------------------------------
// Download de arquivos (imagens, vídeos, PDFs) hospedados no Notion
// ---------------------------------------------------------------------------
const usedAssets = new Set()
const EXT_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'application/pdf': '.pdf',
}

async function downloadAsset(url, key) {
  const urlPath = new URL(url).pathname
  let ext = path.extname(decodeURIComponent(urlPath)).toLowerCase().slice(0, 6)
  const hash = crypto.createHash('sha1').update(key + urlPath).digest('hex').slice(0, 16)

  // Reaproveita o arquivo se ele já foi baixado numa sincronização anterior.
  if (fs.existsSync(ASSETS_DIR)) {
    const existing = fs.readdirSync(ASSETS_DIR).find((f) => f.startsWith(hash + '.') || f === hash)
    if (existing) {
      usedAssets.add(existing)
      return `${ASSETS_URL}/${existing}`
    }
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!ext) ext = EXT_BY_TYPE[(res.headers.get('content-type') || '').split(';')[0]] || ''
      const file = hash + ext
      await fsp.mkdir(ASSETS_DIR, { recursive: true })
      await fsp.writeFile(path.join(ASSETS_DIR, file), Buffer.from(await res.arrayBuffer()))
      usedAssets.add(file)
      return `${ASSETS_URL}/${file}`
    } catch (err) {
      if (attempt === 3) throw new SyncError(`Não consegui baixar o arquivo ${urlPath}: ${err.message}`)
      await sleep(800 * attempt)
    }
  }
}

// Notion usa {type:'file', file:{url}} para arquivos enviados (expiram) e
// {type:'external', external:{url}} para links externos (não expiram).
async function resolveFile(f, key) {
  if (!f) return null
  if (f.type === 'external') return f.external?.url || null
  if (f.type === 'file' && f.file?.url) return downloadAsset(f.file.url, key)
  return null
}

// ---------------------------------------------------------------------------
// Conversão dos blocos do Notion para um formato enxuto que o site renderiza
// ---------------------------------------------------------------------------
function rich(list = []) {
  return list.map((r) => {
    const out = { t: r.plain_text ?? '' }
    if (r.type === 'equation') out.eq = r.equation?.expression ?? r.plain_text
    if (r.href) out.href = r.href
    if (r.type === 'mention' && r.mention?.type === 'page' && !r.href) out.href = null
    const a = r.annotations || {}
    const marks = {}
    if (a.bold) marks.b = 1
    if (a.italic) marks.i = 1
    if (a.strikethrough) marks.s = 1
    if (a.underline) marks.u = 1
    if (a.code) marks.c = 1
    if (a.color && a.color !== 'default') marks.color = a.color
    if (Object.keys(marks).length) out.m = marks
    return out
  })
}

const TEXT_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'quote',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'callout',
])
const SKIP_TYPES = new Set(['child_page', 'child_database', 'unsupported', 'breadcrumb', 'template', 'link_to_page'])

async function getChildren(blockId) {
  return paginate('GET', `/blocks/${blockId}/children`)
}

async function convertBlocks(rawBlocks, ctx) {
  const out = []
  for (const b of rawBlocks) {
    const converted = await convertBlock(b, ctx)
    if (converted) out.push(converted)
  }
  return out
}

async function convertBlock(b, ctx) {
  const type = b.type
  if (SKIP_TYPES.has(type)) return null
  const data = b[type] || {}
  const block = { id: b.id, type }

  if (TEXT_TYPES.has(type)) {
    block.text = rich(data.rich_text)
    if (data.color && data.color !== 'default') block.color = data.color
    if (type === 'to_do') block.checked = !!data.checked
    if (type === 'callout') {
      const icon = data.icon
      if (icon?.type === 'emoji') block.icon = icon.emoji
      else if (icon) block.iconUrl = await resolveFile(icon, b.id + ':icon').catch(() => null)
    }
    if (type.startsWith('heading_')) {
      block.anchor = slugify(plain(data.rich_text)) || b.id.slice(0, 8)
      if (data.is_toggleable) block.toggle = true
    }
  } else if (type === 'code') {
    block.code = plain(data.rich_text)
    block.language = data.language || 'plain text'
    block.caption = rich(data.caption)
  } else if (['image', 'video', 'audio', 'file', 'pdf'].includes(type)) {
    block.url = await resolveFile(data, b.id)
    block.caption = rich(data.caption)
    block.name = data.name || ''
    if (!block.url) return null
  } else if (['embed', 'bookmark', 'link_preview'].includes(type)) {
    block.url = data.url
    block.caption = rich(data.caption)
    if (!block.url) return null
  } else if (type === 'equation') {
    block.expression = data.expression
  } else if (type === 'divider' || type === 'table_of_contents' || type === 'column_list' || type === 'column') {
    // sem dados próprios
  } else if (type === 'table') {
    block.hasColumnHeader = !!data.has_column_header
    block.hasRowHeader = !!data.has_row_header
  } else if (type === 'table_row') {
    block.cells = (data.cells || []).map((c) => rich(c))
  } else if (type === 'synced_block') {
    // Bloco sincronizado: o conteúdo pode estar em outro lugar.
    const sourceId = data.synced_from?.block_id
    if (sourceId) {
      try {
        block.children = await convertBlocks(await getChildren(sourceId), ctx)
      } catch (err) {
        warn(`Bloco sincronizado ${sourceId} indisponível (compartilhe a página de origem com a integração).`)
        block.children = []
      }
      return block
    }
  } else {
    warn(`Tipo de bloco "${type}" ainda não é suportado no post "${ctx.title}" e foi ignorado.`)
    return null
  }

  if (b.has_children) {
    block.children = await convertBlocks(await getChildren(b.id), ctx)
  }
  return block
}

// Texto corrido usado em resumo automático e na busca.
function blocksToText(blocks, limit = Infinity) {
  let txt = ''
  for (const b of blocks) {
    if (b.text) txt += b.text.map((r) => r.t).join('') + ' '
    if (b.children) txt += blocksToText(b.children) + ' '
    if (txt.length > limit) break
  }
  return txt.replace(/\s+/g, ' ').trim()
}

function makeExcerpt(blocks) {
  // Convenção herdada do blog antigo: o que vem antes do primeiro divisor é o resumo.
  const dividerIdx = blocks.findIndex((b) => b.type === 'divider')
  const intro = dividerIdx > 0 ? blocks.slice(0, dividerIdx) : blocks
  const text = blocksToText(intro.filter((b) => b.type === 'paragraph' || b.type === 'quote'), 400)
  if (text.length <= 220) return text
  const cut = text.slice(0, 220)
  return cut.slice(0, cut.lastIndexOf(' ')) + '…'
}

// ---------------------------------------------------------------------------
// Banco de dados
// ---------------------------------------------------------------------------
const isNotFound = (err) => err && (err.status === 404 || err.status === 400)

// Descobre de onde ler os posts. Aceita:
//  • ID de banco de dados (API nova, com "fontes de dados", ou API antiga);
//  • ID de uma fonte de dados;
//  • ID de uma página que contém o banco de dados (como no blog antigo).
async function resolveSource(id, depth = 0) {
  const errors = []

  // 1) Banco de dados na API nova → usa a (primeira) fonte de dados dele
  try {
    const db = await notion('GET', `/databases/${id}`, null, NEW_VERSION)
    const sources = db.data_sources || []
    if (sources.length > 1) {
      warn(`Esse banco de dados tem ${sources.length} fontes de dados; usando a primeira: "${sources[0].name}".`)
    }
    if (sources.length) {
      log(`Banco de dados encontrado (fonte de dados "${sources[0].name || sources[0].id}").`)
      return { query: `/data_sources/${sources[0].id}/query`, version: NEW_VERSION }
    }
    throw new SyncError(
      `A integração enxerga o banco de dados ${id}, mas não os dados dele.\n` +
        `  Isso quase sempre quer dizer que esse banco é uma VISUALIZAÇÃO VINCULADA (linked view)\n` +
        `  de outro banco de dados, e a integração não está conectada ao banco ORIGINAL.\n` +
        `  Como resolver:\n` +
        `  • No Notion, clique no nome do banco de dados (ao lado dele aparece uma setinha ↗) para abrir o original;\n` +
        `  • No banco original: "•••" → "Conexões" → adicione a sua integração;\n` +
        `  • Use o ID do banco ORIGINAL (o da URL dele) em NOTION_DATABASE_ID.`
    )
  } catch (err) {
    if (err instanceof SyncError) throw err
    if (!isNotFound(err)) throw err
    errors.push(err.message)
  }

  // 2) O ID já é de uma fonte de dados
  try {
    await notion('GET', `/data_sources/${id}`, null, NEW_VERSION)
    return { query: `/data_sources/${id}/query`, version: NEW_VERSION }
  } catch (err) {
    if (!isNotFound(err)) throw err
    errors.push(err.message)
  }

  // 3) API antiga
  try {
    await notion('GET', `/databases/${id}`)
    return { query: `/databases/${id}/query`, version: NOTION_VERSION }
  } catch (err) {
    if (!isNotFound(err)) throw err
    errors.push(err.message)
  }

  // 4) Talvez seja uma página que contém o banco de dados (procura também dentro de colunas)
  const help =
    `\n  O que conferir:\n` +
    `  • No Notion, abra o banco de dados → "•••" → "Conexões" e adicione a sua integração.\n` +
    `  • Se o banco de dados for uma "visualização vinculada" (linked view) de outro banco,\n` +
    `    use o ID do banco ORIGINAL e conecte a integração a ele.\n` +
    `  Respostas do Notion:\n    - ${errors.join('\n    - ')}`
  if (depth > 0) throw new SyncError(`Não consegui ler o banco de dados ${id}.${help}`)

  let found = null
  try {
    const queue = [{ id, level: 0 }]
    while (queue.length && !found) {
      const { id: parent, level } = queue.shift()
      const children = await getChildren(parent)
      found = children.find((c) => c.type === 'child_database')
      if (!found && level < 2) {
        children
          .filter((c) => c.has_children && ['column_list', 'column', 'toggle', 'callout'].includes(c.type))
          .forEach((c) => queue.push({ id: c.id, level: level + 1 }))
      }
    }
  } catch {
    throw new SyncError(`Não encontrei o banco de dados ${id}.${help}`)
  }
  if (!found) throw new SyncError(`Não consegui ler o banco de dados ${id} (nem achei um banco dentro dessa página).${help}`)
  log(`ID informado é de uma página; usando o banco de dados "${found.child_database?.title}" (${found.id}).`)
  return resolveSource(found.id, depth + 1)
}

async function fetchPosts(source) {
  const pages = await paginate('POST', source.query, {}, source.version)
  log(`${pages.length} linha(s) no banco de dados.`)
  if (pages.length) {
    const cols = Object.entries(pages[0].properties)
      .map(([k, v]) => `${k} (${v.type})`)
      .join(', ')
    log(`Colunas encontradas: ${cols}`)
    if (!findProp(pages[0].properties, PROPS.published)) {
      warn(`Não achei a coluna de publicação (${PROPS.published.join('/')}). Nenhum post será publicado.`)
    }
  }

  const posts = []
  const slugs = new Set()
  for (const page of pages) {
    if (page.archived || page.in_trash) continue
    const props = page.properties
    if (!isPublished(findProp(props, PROPS.published))) continue

    const titleProp = Object.values(props).find((p) => p.type === 'title')
    const title = propText(titleProp).trim() || 'Sem título'
    let slug = slugify(propText(findProp(props, PROPS.slug)).replace(/^\/+|\/+$/g, '')) || slugify(title)
    if (slugs.has(slug)) {
      const base = slug
      let i = 2
      while (slugs.has(`${base}-${i}`)) i++
      slug = `${base}-${i}`
      warn(`Slug repetido "${base}" no post "${title}". Usando "${slug}". Ajuste a coluna Slug no Notion.`)
    }
    slugs.add(slug)

    const dateProp = findProp(props, PROPS.date)
    const date = (dateProp?.type === 'date' && dateProp.date?.start) || page.created_time

    log(`→ ${title}`)
    const ctx = { title }
    const blocks = await convertBlocks(await getChildren(page.id), ctx)

    let cover = null
    const coverProp = findProp(props, PROPS.cover)
    if (coverProp?.type === 'files' && coverProp.files[0]) cover = await resolveFile(coverProp.files[0], page.id + ':cover')
    if (!cover && page.cover) cover = await resolveFile(page.cover, page.id + ':pagecover')
    if (!cover) {
      const firstImg = blocks.find((b) => b.type === 'image')
      if (firstImg) cover = firstImg.url
    }

    const description = propText(findProp(props, PROPS.description)).trim() || makeExcerpt(blocks)
    const categories = propList(findProp(props, PROPS.categories)).map((name) => ({ name, slug: slugify(name) }))

    posts.push({
      id: page.id,
      slug,
      title,
      date,
      updated: page.last_edited_time,
      authors: propPeople(findProp(props, PROPS.authors)),
      categories,
      description,
      cover,
      searchText: blocksToText(blocks, 3000).slice(0, 3000),
      blocks,
    })
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date))
  return posts
}

// ---------------------------------------------------------------------------
// Arquivos gerados: sitemap, RSS, robots, índice de busca
// ---------------------------------------------------------------------------
const xmlEscape = (s) =>
  String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

const isoDate = (d) => {
  const t = new Date(d)
  return isNaN(t) ? new Date().toISOString() : t.toISOString()
}

const absolute = (u) => (!u ? null : /^https?:\/\//.test(u) ? u : siteConfig.siteUrl + encodeURI(u))

function buildSitemap(posts, categories) {
  const { siteUrl, postsPerPage } = siteConfig
  const newest = posts.length
    ? isoDate(posts.reduce((max, p) => (new Date(p.updated) > new Date(max) ? p.updated : max), posts[0].updated))
    : new Date().toISOString()
  const urls = [
    { loc: `${siteUrl}/`, lastmod: newest },
    { loc: `${siteUrl}/blog`, lastmod: newest },
    { loc: `${siteUrl}/contato` },
  ]
  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage))
  for (let p = 2; p <= totalPages; p++) urls.push({ loc: `${siteUrl}/blog/page/${p}`, lastmod: newest })
  for (const post of posts) {
    urls.push({ loc: `${siteUrl}/blog/${post.slug}`, lastmod: isoDate(post.updated), image: absolute(post.cover) })
  }
  for (const c of categories) {
    urls.push({ loc: `${siteUrl}/categoria/${c.slug}`, lastmod: isoDate(c.updated) })
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
          (u.image ? `    <image:image><image:loc>${xmlEscape(u.image)}</image:loc></image:image>\n` : '') +
          `  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`
  )
}

function buildRss(posts) {
  const { siteUrl, name, description } = siteConfig
  const items = posts
    .slice(0, 30)
    .map((p) => {
      const link = `${siteUrl}/blog/${p.slug}`
      return (
        `    <item>\n` +
        `      <title>${xmlEscape(p.title)}</title>\n` +
        `      <link>${link}</link>\n` +
        `      <guid isPermaLink="true">${link}</guid>\n` +
        `      <pubDate>${new Date(p.date).toUTCString()}</pubDate>\n` +
        (p.authors[0] ? `      <dc:creator>${xmlEscape(p.authors.join(', '))}</dc:creator>\n` : '') +
        p.categories.map((c) => `      <category>${xmlEscape(c.name)}</category>\n`).join('') +
        `      <description>${xmlEscape(p.description)}</description>\n` +
        `    </item>`
      )
    })
    .join('\n')
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
    `  <channel>\n` +
    `    <title>${xmlEscape(name)}</title>\n` +
    `    <link>${siteUrl}</link>\n` +
    `    <description>${xmlEscape(description)}</description>\n` +
    `    <language>pt-BR</language>\n` +
    `    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>\n` +
    (posts[0] ? `    <lastBuildDate>${new Date(posts[0].updated).toUTCString()}</lastBuildDate>\n` : '') +
    items +
    `\n  </channel>\n</rss>\n`
  )
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
async function main() {
  const started = Date.now()
  if (typeof fetch !== 'function') {
    throw new SyncError(`Seu Node.js (${process.version}) é antigo demais. Instale o Node 20 ou 22: https://nodejs.org`)
  }
  const token = process.env.NOTION_TOKEN
  const rawId = process.env.NOTION_DATABASE_ID || process.env.BLOG_INDEX_ID

  if (!token || !rawId) {
    const existing = path.join(CONTENT_DIR, 'posts.json')
    if (!process.env.VERCEL && !process.env.CI && fs.existsSync(existing)) {
      warn('NOTION_TOKEN/NOTION_DATABASE_ID não definidos. Usando o conteúdo baixado na última sincronização.')
      return
    }
    throw new SyncError(
      'Defina NOTION_TOKEN e NOTION_DATABASE_ID (no arquivo .env.local para rodar no computador, ' +
        'ou em Settings → Environment Variables na Vercel).'
    )
  }
  if (/^v0\d(:|%3A)/i.test(token) || /^[0-9a-f]{100,}$/i.test(token)) {
    throw new SyncError(
      'O NOTION_TOKEN parece ser o cookie "token_v2" do blog antigo. ' +
        'O novo blog usa a API oficial: crie uma integração em https://www.notion.so/profile/integrations e use o token dela.'
    )
  }

  const source = await resolveSource(normalizeId(rawId))
  const posts = await fetchPosts(source)
  if (!posts.length) warn('Nenhum post publicado encontrado. O blog vai ficar sem posts.')

  // Categorias
  const catMap = new Map()
  for (const p of posts) {
    for (const c of p.categories) {
      const cur = catMap.get(c.slug) || { ...c, count: 0, updated: p.updated }
      cur.count++
      if (new Date(p.updated) > new Date(cur.updated)) cur.updated = p.updated
      catMap.set(c.slug, cur)
    }
  }
  const categories = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  // Escreve o conteúdo (apaga a versão anterior primeiro)
  await fsp.rm(POSTS_DIR, { recursive: true, force: true })
  await fsp.mkdir(POSTS_DIR, { recursive: true })
  for (const p of posts) {
    await fsp.writeFile(path.join(POSTS_DIR, `${p.slug}.json`), JSON.stringify(p))
  }
  const index = posts.map(({ blocks, searchText, ...meta }) => meta)
  await fsp.writeFile(path.join(CONTENT_DIR, 'posts.json'), JSON.stringify(index, null, 1))
  await fsp.writeFile(path.join(CONTENT_DIR, 'categories.json'), JSON.stringify(categories, null, 1))

  await fsp.writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemap(posts, categories))
  await fsp.writeFile(path.join(PUBLIC_DIR, 'rss.xml'), buildRss(posts))
  await fsp.writeFile(
    path.join(PUBLIC_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.siteUrl}/sitemap.xml\n`
  )
  await fsp.writeFile(
    path.join(PUBLIC_DIR, 'search-index.json'),
    JSON.stringify(
      posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        authors: p.authors,
        categories: p.categories.map((c) => c.name),
        text: `${p.description} ${p.searchText}`.slice(0, 3000),
      }))
    )
  )

  // Remove arquivos baixados que não são mais usados por nenhum post
  if (fs.existsSync(ASSETS_DIR)) {
    for (const f of fs.readdirSync(ASSETS_DIR)) {
      if (!usedAssets.has(f)) await fsp.rm(path.join(ASSETS_DIR, f), { force: true })
    }
  }

  log(
    `✅ ${posts.length} post(s), ${categories.length} categoria(s), ${usedAssets.size} arquivo(s) de mídia. ` +
      `(${((Date.now() - started) / 1000).toFixed(1)}s)`
  )
}

// Carrega o .env.local quando rodando no computador (a Vercel injeta as variáveis sozinha).
function loadEnvFile() {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name)
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

loadEnvFile()
main().catch((err) => {
  const cause = err && err.cause ? ` (${err.cause.code || err.cause.message || err.cause})` : ''
  console.error('\n[notion] ❌ A sincronização falhou:\n  ' + (err.message || err) + cause)
  console.error(`  Node ${process.version}`)
  if (!(err instanceof SyncError) && err.stack) console.error(err.stack)
  process.exit(1)
})
