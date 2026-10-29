// Pré-processa no build o que é pesado (destaque de código e fórmulas),
// para que o navegador não precise baixar Prism nem KaTeX.
// Só é importado dentro de getStaticProps, então não vai para o navegador.
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/index'
import katex from 'katex'
import type { Block, RichText } from './types'

const LANG_ALIASES: Record<string, string> = {
  'plain text': 'plain',
  shell: 'bash',
  html: 'markup',
  xml: 'markup',
  'c#': 'csharp',
  'c++': 'cpp',
  js: 'javascript',
  ts: 'typescript',
}

function highlight(code: string, language?: string) {
  const lang = LANG_ALIASES[(language || '').toLowerCase()] || (language || 'plain').toLowerCase()
  if (lang !== 'plain' && !Prism.languages[lang]) {
    try {
      loadLanguages([lang])
    } catch {
      /* linguagem desconhecida: fica sem cores */
    }
  }
  const grammar = Prism.languages[lang]
  return { lang, html: grammar ? Prism.highlight(code, grammar, lang) : null }
}

const tex = (expr: string, displayMode = false) => katex.renderToString(expr, { displayMode, throwOnError: false })

function richText(list?: RichText[]) {
  list?.forEach((r) => {
    if (r.eq) r.html = tex(r.eq)
  })
}

export function prerenderBlocks(blocks: Block[]): Block[] {
  for (const b of blocks) {
    richText(b.text)
    richText(b.caption)
    b.cells?.forEach(richText)
    if (b.type === 'code') {
      const { lang, html } = highlight(b.code || '', b.language)
      b.language = lang
      if (html) b.html = html
    }
    if (b.type === 'equation') b.html = tex(b.expression || '', true)
    if (b.children) prerenderBlocks(b.children)
  }
  return blocks
}
