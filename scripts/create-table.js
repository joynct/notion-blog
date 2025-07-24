const main = require('../src/lib/notion/createTable')

main()
import { getAllPosts } from '../lib/notion'

async function main() {
  const posts = await getAllPosts()
  console.log(posts)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
