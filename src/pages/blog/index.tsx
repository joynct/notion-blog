import BlogIndexPage, { BlogIndexProps } from '../../components/BlogIndexPage'
import { getBlogPage } from '../../lib/pagination'

export async function getStaticProps() {
  return { props: getBlogPage(1) }
}

export default function Blog(props: BlogIndexProps) {
  return <BlogIndexPage {...props} />
}
