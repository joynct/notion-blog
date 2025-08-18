import { Sema } from 'async-sema'
import rpc, { values } from './rpc'
import getTableData from './getTableData'
import { getPostPreview } from './getPostPreview'
import { readFile, writeFile } from '../fs-helpers'
import { BLOG_INDEX_ID, BLOG_INDEX_CACHE } from './server-constants'

export default async function getBlogIndex(previews = true) {
  let postsTable: any = null
  const useCache =
    process.env.USE_CACHE === 'true' && process.env.NODE_ENV !== 'production'
  const cacheFile = `${BLOG_INDEX_CACHE}${previews ? '_previews' : ''}`

  // === CACHE INTELIGENTE ===
  if (useCache) {
    try {
      const cacheData = await readFile(cacheFile, 'utf8')
      const parsedCache = JSON.parse(cacheData)

      // Validação básica do cache
      if (
        parsedCache &&
        typeof parsedCache === 'object' &&
        Object.keys(parsedCache).length > 0
      ) {
        // Verifica se os posts têm estrutura válida
        const firstPost = Object.values(parsedCache)[0] as any
        if (firstPost && firstPost.Page && firstPost.Slug) {
          postsTable = parsedCache
          console.log(
            `✅ Cache válido carregado com ${
              Object.keys(postsTable).length
            } posts`
          )
        } else {
          console.log(
            '⚠️ Cache com estrutura inválida, buscando dados frescos...'
          )
        }
      } else {
        console.log('⚠️ Cache vazio, buscando dados frescos...')
      }
    } catch (error) {
      console.log(
        '⚠️ Erro ao ler cache, buscando dados frescos:',
        error.message
      )
    }
  }

  if (!postsTable) {
    try {
      console.log('🔍 Buscando dados do Notion...')

      const data = await rpc('loadPageChunk', {
        pageId: BLOG_INDEX_ID,
        limit: 100, // TODO: figure out Notion's way of handling pagination
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      })

      // Parse table with posts
      const tableBlock = values(data.recordMap.block).find(
        (block: any) => block.value.type === 'collection_view'
      )

      if (!tableBlock) {
        throw new Error(
          'TableBlock não encontrado - verificar se a página é uma database'
        )
      }

      postsTable = await getTableData(tableBlock, true)
      console.log(
        `✅ ${Object.keys(postsTable).length} posts carregados do Notion`
      )

      // Processar categorias para cada post
      for (const slug in postsTable) {
        if (postsTable.hasOwnProperty(slug)) {
          const post = postsTable[slug]
          let categories: string[] = []

          if (post.Category) {
            // Caso 1: Array de objetos com propriedade 'name' (formato padrão da API do Notion)
            if (Array.isArray(post.Category)) {
              categories = post.Category.map((item) => {
                if (typeof item === 'object' && item.name) {
                  return item.name
                } else if (typeof item === 'string') {
                  return item
                }
                return null
              }).filter(Boolean)
            }
            // Caso 2: String única (pode estar separada por vírgula)
            else if (typeof post.Category === 'string') {
              categories = post.Category.split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            }
            // Caso 3: Objeto único com propriedade name
            else if (typeof post.Category === 'object' && post.Category.name) {
              categories = [post.Category.name]
            }
          }
          postsTable[slug].Category = categories
        }
      }

      // === SALVA CACHE APENAS SE DADOS SÃO VÁLIDOS ===
      if (useCache && postsTable && Object.keys(postsTable).length > 0) {
        try {
          await writeFile(cacheFile, JSON.stringify(postsTable), 'utf8')
          console.log('💾 Cache salvo com sucesso')
        } catch (cacheError) {
          console.warn('⚠️ Erro ao salvar cache:', cacheError.message)
        }
      }
    } catch (err) {
      console.error('❌ Erro ao buscar do Notion:', err.message)
      console.warn(
        'Failed to load Notion posts, have you run the create-table script?'
      )
      return {}
    }

    //  Força busca dos previews mesmo com cache válido
    const postsKeys = Object.keys(postsTable).splice(0, 10)

    const sema = new Sema(1, { capacity: postsKeys.length })

    if (previews) {
      await Promise.all(
        postsKeys
          .sort((a, b) => {
            const postA = postsTable[a]
            const postB = postsTable[b]
            const timeA = postA.Date
            const timeB = postB.Date
            return Math.sign(timeB - timeA)
          })
          .map(async (postKey) => {
            await sema.acquire()

            // Adiciona delay entre requisições
            await new Promise((resolve) => setTimeout(resolve, 200))

            try {
              const post = postsTable[postKey]
              post.preview = post.id
                ? await getPostPreview(postsTable[postKey].id)
                : []
            } catch (error) {
              console.warn(
                `Erro ao buscar preview do post ${postKey}:`,
                error.message
              )
              postsTable[postKey].preview = []
            }

            sema.release()
          })
      )
    }
  }

  return postsTable
}
