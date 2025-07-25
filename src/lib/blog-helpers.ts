export const getBlogLink = (slug: string) => {
  return `/blog/${slug}`
}

export const getDateStr = (date: string) => {
  const d = new Date(date)

  const day = d.getDate()
  const month = d.toLocaleString('pt-BR', { month: 'long' })
  const year = d.getFullYear()

  return `${day} de ${month}, ${year}`
}

export const postIsPublished = (post: any) => {
  return post.Published === 'Yes'
}

export const normalizeSlug = (slug) => {
  if (typeof slug !== 'string') return slug

  let startingSlash = slug.startsWith('/')
  let endingSlash = slug.endsWith('/')

  if (startingSlash) {
    slug = slug.substr(1)
  }
  if (endingSlash) {
    slug = slug.substr(0, slug.length - 1)
  }
  return startingSlash || endingSlash ? normalizeSlug(slug) : slug
}
