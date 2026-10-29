// Lê o conteúdo baixado do Notion por scripts/sync-notion.mjs.
// Só é usado dentro de getStaticProps/getStaticPaths (ou seja, no build).
import fs from 'fs'
import path from 'path'
import type { Category, Post, PostMeta } from './types'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function readJson<T>(file: string): T {
  const full = path.join(CONTENT_DIR, file)
  if (!fs.existsSync(full)) {
    throw new Error(
      `Arquivo ${path.relative(process.cwd(), full)} não encontrado. Rode "npm run sync" para baixar o conteúdo do Notion.`
    )
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'))
}

export const getAllPosts = (): PostMeta[] => readJson<PostMeta[]>('posts.json')

export const getCategories = (): Category[] => readJson<Category[]>('categories.json')

export function getPost(slug: string): Post | null {
  const file = path.join(CONTENT_DIR, 'posts', `${slug}.json`)
  if (!fs.existsSync(file)) return null
  const { searchText, ...post } = JSON.parse(fs.readFileSync(file, 'utf8'))
  return post
}
