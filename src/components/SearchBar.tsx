import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getBlogLink } from '../lib/blog-helpers'
import searchStyles from '../styles/search.module.css'

interface Post {
  Slug: string
  Page: string
  Authors: string[]
  Date: string
  preview?: string
}

interface SearchBarProps {
  posts: Post[]
}

const SearchBar: React.FC<SearchBarProps> = ({ posts }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = posts.filter((post) => {
        // Buscar no título
        const titleMatch = post.Page.toLowerCase().includes(
          searchTerm.toLowerCase()
        )

        // Buscar nos autores
        const authorMatch = post.Authors.some((author) =>
          author.toLowerCase().includes(searchTerm.toLowerCase())
        )

        // Buscar no preview (primeiros parágrafos do post)
        let previewMatch = false
        if (post.preview && Array.isArray(post.preview)) {
          const previewText = post.preview
            .map((block) => {
              // Extrair texto do bloco do Notion
              if (
                block.value &&
                block.value.properties &&
                block.value.properties.title
              ) {
                return block.value.properties.title
                  .map((item) => item[0])
                  .join(' ')
              }
              return ''
            })
            .join(' ')

          previewMatch = previewText
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        }

        return titleMatch || authorMatch || previewMatch
      })

      setFilteredPosts(filtered)
      setShowResults(true)
    } else {
      setFilteredPosts([])
      setShowResults(false)
    }
  }, [searchTerm, posts])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setShowResults(false)
  }

  return (
    <div className={searchStyles.searchContainer}>
      <div className={searchStyles.searchInputWrapper}>
        <input
          type="text"
          placeholder="Pesquisar posts..."
          value={searchTerm}
          onChange={handleInputChange}
          className={searchStyles.searchInput}
        />
        {searchTerm && (
          <button onClick={clearSearch} className={searchStyles.clearButton}>
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div className={searchStyles.searchResults}>
          {filteredPosts.length > 0 ? (
            <>
              <div className={searchStyles.resultsHeader}>
                {filteredPosts.length} resultado(s) encontrado(s)
              </div>
              {filteredPosts.map((post) => (
                <Link key={post.Slug} href={getBlogLink(post.Slug)}>
                  <a className={searchStyles.resultItem} onClick={clearSearch}>
                    <div className={searchStyles.resultTitle}>{post.Page}</div>
                    <div className={searchStyles.resultMeta}>
                      Por {post.Authors.join(', ')} •{' '}
                      {new Date(post.Date).toLocaleDateString('pt-BR')}
                    </div>
                  </a>
                </Link>
              ))}
            </>
          ) : (
            <div className={searchStyles.noResults}>
              Nenhum post encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
