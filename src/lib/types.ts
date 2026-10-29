export type RichText = {
  t: string
  href?: string | null
  eq?: string
  html?: string
  m?: { b?: 1; i?: 1; s?: 1; u?: 1; c?: 1; color?: string }
}

export type Block = {
  id: string
  type: string
  text?: RichText[]
  color?: string
  checked?: boolean
  icon?: string
  iconUrl?: string | null
  anchor?: string
  toggle?: boolean
  code?: string
  language?: string
  caption?: RichText[]
  url?: string
  name?: string
  expression?: string
  html?: string
  hasColumnHeader?: boolean
  hasRowHeader?: boolean
  cells?: RichText[][]
  children?: Block[]
}

export type Category = { name: string; slug: string; count?: number }

export type PostMeta = {
  id: string
  slug: string
  title: string
  date: string
  updated: string
  authors: string[]
  categories: Category[]
  description: string
  cover: string | null
}

export type Post = PostMeta & { blocks: Block[] }
