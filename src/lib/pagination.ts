import site from '../../site.config'
import { getAllPosts, getCategories } from './content'
import type { BlogIndexProps } from '../components/BlogIndexPage'

export function getTotalPages(): number {
  return Math.max(1, Math.ceil(getAllPosts().length / site.postsPerPage))
}

export function getBlogPage(page: number): BlogIndexProps {
  const all = getAllPosts()
  const start = (page - 1) * site.postsPerPage
  return {
    posts: all.slice(start, start + site.postsPerPage),
    currentPage: page,
    totalPages: getTotalPages(),
    categories: getCategories(),
  }
}
