import { useEffect, useRef, useState } from 'react'
import { searchCities } from '../api.js'

/*
 * Barre de recherche de ville avec suggestions.
 * On attend que l'utilisateur arrête de taper (300 ms) avant d'appeler l'API,
 * et on annule la requête précédente si une nouvelle lettre est tapée.
 * Flèches haut/bas pour choisir, Entrée pour valider, Échap pour fermer.
 */
export default function Search({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setNotFound(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const list = await searchCities(q, controller.signal)
        setResults(list)
        setActive(0)
        setNotFound(list.length === 0)
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') setResults([])
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // fermer la liste quand on clique ailleurs
  useEffect(() => {
    const close = (e) => !boxRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (city) => {
    onSelect(city)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[active]) {
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="search" ref={boxRef}>
      <span className="search-icon" aria-hidden="true">
        🔍
      </span>
      <input
        type="search"
        value={query}
        placeholder="Rechercher une ville…"
        aria-label="Rechercher une ville"
        aria-expanded={open && results.length > 0}
        aria-controls="search-list"
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (results.length > 0 || notFound) && (
        <ul className="search-list" id="search-list" role="listbox">
          {notFound && <li className="search-empty">Aucune ville trouvée</li>}
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onClick={() => choose(c)}>
                <b>{c.name}</b>
                <span>{[c.region, c.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
