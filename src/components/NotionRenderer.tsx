import React from 'react'
import type { Block, RichText } from '../lib/types'

// ---------------------------------------------------------------------------
// Texto com formatação (negrito, itálico, links, cores, equações inline)
// ---------------------------------------------------------------------------
export function Text({ value }: { value?: RichText[] }) {
  if (!value || !value.length) return null
  return (
    <>
      {value.map((r, i) => {
        let node: React.ReactNode
        if (r.eq) {
          node = r.html ? <span dangerouslySetInnerHTML={{ __html: r.html }} /> : <code>{r.eq}</code>
        } else {
          node = r.t
        }
        const m = r.m || {}
        if (m.c) node = <code>{node}</code>
        if (m.b) node = <strong>{node}</strong>
        if (m.i) node = <em>{node}</em>
        if (m.s) node = <s>{node}</s>
        if (m.u) node = <span className="underline">{node}</span>
        if (m.color) node = <span className={colorClass(m.color)}>{node}</span>
        if (r.href) {
          const external = /^https?:\/\//.test(r.href)
          node = (
            <a
              href={r.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {node}
            </a>
          )
        }
        return <React.Fragment key={i}>{node}</React.Fragment>
      })}
    </>
  )
}

const colorClass = (c?: string) => (c && c !== 'default' ? `notion-${c.replace('_', '-')}` : undefined)

const plainText = (rt?: RichText[]) => (rt || []).map((r) => r.t).join('')

// ---------------------------------------------------------------------------
// Código com destaque de sintaxe (as cores são aplicadas no build)
// ---------------------------------------------------------------------------
function CodeBlock({ block }: { block: Block }) {
  // block.html já vem com as cores aplicadas no build (src/lib/prerender.ts)
  const lang = block.language || 'plain'
  const html = block.html
  return (
    <figure className="code-block">
      <pre className={`language-${lang}`}>
        {html ? (
          <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{block.code}</code>
        )}
      </pre>
      {block.caption && block.caption.length > 0 && (
        <figcaption>
          <Text value={block.caption} />
        </figcaption>
      )}
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Vídeos e incorporações
// ---------------------------------------------------------------------------
function embedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') || u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/\/(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    if (host === 'open.spotify.com') return `https://open.spotify.com/embed${u.pathname}`
    if (host === 'loom.com') return url.replace('/share/', '/embed/')
    if (host === 'google.com' && u.pathname.startsWith('/maps')) return url
    if (host === 'canva.com' && u.pathname.includes('/view')) return url.includes('?embed') ? url : `${url.split('?')[0]}?embed`
  } catch {
    /* url inválida */
  }
  return null
}

function Bookmark({ url, caption }: { url: string; caption?: RichText[] }) {
  let host = url
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {}
  const title = plainText(caption) || host
  return (
    <a className="bookmark" href={url} target="_blank" rel="noopener noreferrer">
      <span className="bookmark-title">{title}</span>
      <span className="bookmark-url">{url}</span>
    </a>
  )
}

function Caption({ value }: { value?: RichText[] }) {
  if (!value || !value.length) return null
  return (
    <figcaption>
      <Text value={value} />
    </figcaption>
  )
}

function Media({ block, postTitle }: { block: Block; postTitle?: string }) {
  const url = block.url as string
  const caption = block.caption
  switch (block.type) {
    case 'image':
      return (
        <figure>
          <img src={url} alt={plainText(caption) || postTitle || ''} loading="lazy" decoding="async" />
          <Caption value={caption} />
        </figure>
      )
    case 'video': {
      const embed = embedUrl(url)
      return (
        <figure>
          {embed ? (
            <div className="embed-video">
              <iframe src={embed} title={plainText(caption) || 'Vídeo'} loading="lazy" allowFullScreen />
            </div>
          ) : (
            <video src={url} controls preload="metadata" />
          )}
          <Caption value={caption} />
        </figure>
      )
    }
    case 'audio':
      return (
        <figure>
          <audio src={url} controls preload="none" />
          <Caption value={caption} />
        </figure>
      )
    case 'file':
    case 'pdf':
      return (
        <p>
          📎{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">
            {plainText(caption) || block.name || 'Baixar arquivo'}
          </a>
        </p>
      )
    case 'embed':
    case 'link_preview': {
      if (/^https?:\/\/(www\.)?(twitter|x)\.com\/.+\/status\//.test(url)) {
        return (
          <blockquote className="twitter-tweet">
            <a href={url.replace('://x.com', '://twitter.com')}>{url}</a>
          </blockquote>
        )
      }
      const embed = embedUrl(url)
      if (embed)
        return (
          <figure>
            <div className="embed-video">
              <iframe src={embed} title={plainText(caption) || 'Conteúdo incorporado'} loading="lazy" allowFullScreen />
            </div>
            <Caption value={caption} />
          </figure>
        )
      return <Bookmark url={url} caption={caption} />
    }
    case 'bookmark':
      return <Bookmark url={url} caption={caption} />
  }
  return null
}

// ---------------------------------------------------------------------------
// Blocos
// ---------------------------------------------------------------------------
function Children({ blocks, postTitle }: { blocks?: Block[]; postTitle?: string }) {
  if (!blocks || !blocks.length) return null
  return <NotionBlocks blocks={blocks} postTitle={postTitle} />
}

function TableOfContents({ all }: { all: Block[] }) {
  const headings: Block[] = []
  const walk = (list: Block[]) =>
    list.forEach((b) => {
      if (b.type.startsWith('heading_')) headings.push(b)
      else if (b.children && b.type !== 'toggle') walk(b.children)
    })
  walk(all)
  if (!headings.length) return null
  return (
    <nav className="toc" aria-label="Sumário">
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={`toc-${h.type}`}>
            <a href={`#${h.anchor}`}>{plainText(h.text)}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function BlockView({ block, all, postTitle }: { block: Block; all: Block[]; postTitle?: string }) {
  const cls = colorClass(block.color)
  switch (block.type) {
    case 'paragraph':
      if (!block.text?.length && !block.children?.length) return <div className="spacer" />
      return (
        <>
          <p className={cls}>
            <Text value={block.text} />
          </p>
          {block.children && (
            <div className="indent">
              <Children blocks={block.children} postTitle={postTitle} />
            </div>
          )}
        </>
      )
    case 'heading_1':
    case 'heading_2':
    case 'heading_3': {
      // O título do post já é o <h1>; os títulos do Notion viram h2, h3 e h4.
      const Tag = (`h${Number(block.type.slice(-1)) + 1}`) as 'h2' | 'h3' | 'h4'
      const heading = (
        <Tag id={block.anchor} className={cls}>
          <Text value={block.text} />
        </Tag>
      )
      if (block.toggle)
        return (
          <details>
            <summary>{heading}</summary>
            <Children blocks={block.children} postTitle={postTitle} />
          </details>
        )
      return heading
    }
    case 'quote':
      return (
        <blockquote className={cls}>
          <Text value={block.text} />
          <Children blocks={block.children} postTitle={postTitle} />
        </blockquote>
      )
    case 'callout':
      return (
        <div className={`callout ${cls || ''}`}>
          {block.icon && <span className="callout-icon">{block.icon}</span>}
          {block.iconUrl && <img className="callout-icon" src={block.iconUrl} alt="" />}
          <div className="text">
            <Text value={block.text} />
            <Children blocks={block.children} postTitle={postTitle} />
          </div>
        </div>
      )
    case 'to_do':
      return (
        <div className="todo">
          <input type="checkbox" checked={!!block.checked} readOnly disabled />{' '}
          <span className={block.checked ? 'todo-done' : undefined}>
            <Text value={block.text} />
          </span>
          <div className="indent">
            <Children blocks={block.children} postTitle={postTitle} />
          </div>
        </div>
      )
    case 'toggle':
      return (
        <details className={cls}>
          <summary>
            <Text value={block.text} />
          </summary>
          <Children blocks={block.children} postTitle={postTitle} />
        </details>
      )
    case 'code':
      return <CodeBlock block={block} />
    case 'equation':
      return (
        block.html ? (
          <div className="equation" dangerouslySetInnerHTML={{ __html: block.html }} />
        ) : (
          <pre className="equation">{block.expression}</pre>
        )
      )
    case 'divider':
      return <hr />
    case 'table_of_contents':
      return <TableOfContents all={all} />
    case 'column_list':
      return (
        <div className="columns">
          {(block.children || []).map((col) => (
            <div className="column" key={col.id}>
              <Children blocks={col.children} postTitle={postTitle} />
            </div>
          ))}
        </div>
      )
    case 'column':
    case 'synced_block':
      return <Children blocks={block.children} postTitle={postTitle} />
    case 'table': {
      const rows = (block.children || []).filter((r) => r.type === 'table_row')
      const head = block.hasColumnHeader ? rows[0] : null
      const body = block.hasColumnHeader ? rows.slice(1) : rows
      return (
        <div className="table-wrapper">
          <table>
            {head && (
              <thead>
                <tr>
                  {(head.cells || []).map((c, i) => (
                    <th key={i}>
                      <Text value={c} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((r) => (
                <tr key={r.id}>
                  {(r.cells || []).map((c, i) =>
                    block.hasRowHeader && i === 0 ? (
                      <th key={i} scope="row">
                        <Text value={c} />
                      </th>
                    ) : (
                      <td key={i}>
                        <Text value={c} />
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    default:
      if (block.url) return <Media block={block} postTitle={postTitle} />
      return null
  }
}

export default function NotionBlocks({
  blocks,
  postTitle,
  root,
}: {
  blocks: Block[]
  postTitle?: string
  root?: Block[]
}) {
  const all = root || blocks
  const out: React.ReactNode[] = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    // Itens de lista consecutivos são agrupados em uma única <ul>/<ol>.
    if (b.type === 'bulleted_list_item' || b.type === 'numbered_list_item') {
      const items: Block[] = []
      while (i < blocks.length && blocks[i].type === b.type) items.push(blocks[i++])
      const List = b.type === 'bulleted_list_item' ? 'ul' : 'ol'
      out.push(
        <List key={b.id}>
          {items.map((it) => (
            <li key={it.id} className={colorClass(it.color)}>
              <Text value={it.text} />
              <Children blocks={it.children} postTitle={postTitle} />
            </li>
          ))}
        </List>
      )
      continue
    }
    out.push(<BlockView key={b.id} block={b} all={all} postTitle={postTitle} />)
    i++
  }
  return <>{out}</>
}
