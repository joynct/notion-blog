import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import searchStyles from '../styles/search.module.css'
import { formatDate } from '../lib/format'

type Entry = { slug: string; title: string; date: string; authors: string[]; categories: string[]; text: string }

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Busca em TODOS os posts (não só os da página atual). O índice é um arquivo
// estático gerado no build e só é baixado quando a pessoa clica na busca.
export default function SearchBar() {
  const [term, setTerm] = useState('')
  const [index, setIndex] = useState<Entry[] | null>(null)
  const loading = useRef(false)

  const load = () => {
    if (index || loading.current) return
    loading.current = true
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]))
  }

  useEffect(() => {
    if (term.length > 0) load()
  }, [term])

  const results = useMemo(() => {
    if (!index || term.trim().length < 3) return []
    const words = normalize(term).split(/\s+/).filter(Boolean)
    return index
      .map((p) => {
        const title = normalize(p.title)
        const body = normalize(`${p.authors.join(' ')} ${p.categories.join(' ')} ${p.text}`)
        if (!words.every((w) => title.includes(w) || body.includes(w))) return null
        const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 1), 0)
        return { p, score }
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .map((r) => r!.p)
  }, [index, term])

  const show = term.trim().length >= 3

  return (
    <div className={searchStyles.searchContainer} role="search">
      <div className={searchStyles.searchInputWrapper}>
        <input
          type="search"
          placeholder="Pesquisar posts..."
          aria-label="Pesquisar posts"
          value={term}
          onFocus={load}
          onChange={(e) => setTerm(e.target.value)}
          className={searchStyles.searchInput}
        />
        {term && (
          <button type="button" aria-label="Limpar busca" onClick={() => setTerm('')} className={searchStyles.clearButton}>
            ✕
          </button>
        )}
      </div>

      {show && (
        <div className={searchStyles.searchResults}>
          {index === null ? (
            <div className={searchStyles.noResults}>Carregando…</div>
          ) : results.length > 0 ? (
            <>
              <div className={searchStyles.resultsHeader}>{results.length} resultado(s) encontrado(s)</div>
              {results.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className={searchStyles.resultItem} onClick={() => setTerm('')}>
                  <div className={searchStyles.resultTitle}>{post.title}</div>
                  <div className={searchStyles.resultMeta}>
                    {post.authors.length > 0 && <>Por {post.authors.join(', ')} • </>}
                    {formatDate(post.date)}
                  </div>
                </Link>
              ))}
            </>
          ) : (
            <div className={searchStyles.noResults}>Nenhum post encontrado para &quot;{term}&quot;</div>
          )}
        </div>
      )}
    </div>
  )
}
