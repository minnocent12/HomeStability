import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Info, Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { FILTER_CATEGORIES } from '../data/resources.js' // presentation config only
import { useResources } from '../ResourcesContext.jsx'
import ResourceCard from './ResourceCard.jsx'

export default function ResourceDirectory() {
  const navigate = useNavigate()
  const { resources, loading } = useResources()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All Categories')
  const [sortBy, setSortBy] = useState('relevant')
  const [moreOpen, setMoreOpen] = useState(false)
  const [selectedCats, setSelectedCats] = useState([]) // multi-select categories
  const moreRef = useRef(null)

  // All categories present (FILTER_CATEGORIES order, plus any extras from data).
  const moreFilterCategories = useMemo(() => {
    const base = FILTER_CATEGORIES.filter((c) => c !== 'All Categories')
    const extra = [...new Set(resources.map((r) => r.category).filter(Boolean))].filter(
      (c) => !base.includes(c),
    )
    return [...base, ...extra]
  }, [resources])

  const toggleCat = (c) =>
    setSelectedCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  // Close the More Filters panel when clicking outside of it.
  useEffect(() => {
    if (!moreOpen) return
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [moreOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = resources.filter((r) => {
      // Single-category button AND multi-select (match ANY selected) both apply.
      const matchesCategory =
        (activeCategory === 'All Categories' || r.category === activeCategory) &&
        (selectedCats.length === 0 || selectedCats.includes(r.category))
      const matchesQuery =
        !q ||
        [r.name, r.category, r.provider, r.description]
          .join(' ')
          .toLowerCase()
          .includes(q)
      return matchesCategory && matchesQuery
    })

    // Sort applies to the already-filtered results. "Most Relevant" keeps the
    // original API order.
    if (sortBy === 'az') {
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    if (sortBy === 'provider') {
      return list.sort((a, b) => (a.provider || '').localeCompare(b.provider || ''))
    }
    return list
  }, [resources, query, activeCategory, sortBy, selectedCats])

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Directory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore trusted resources in Atlanta to support your housing stability.
          </p>
        </div>
        <button
          onClick={() => navigate('/about')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Info size={16} className="text-sage" />
          About This Service
        </button>
      </div>

      {/* Search + sort */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search resources (e.g., rental assistance, legal aid, shelter)"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
        </div>
        <div className="relative">
          <select
            className="h-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevant">Most Relevant</option>
            <option value="az">A – Z</option>
            <option value="provider">By Provider</option>
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTER_CATEGORIES.map((cat) => {
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sage text-white'
                  : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {cat}
            </button>
          )
        })}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              selectedCats.length > 0
                ? 'border-sage bg-sage-light text-sage'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            <SlidersHorizontal size={14} />
            More Filters{selectedCats.length > 0 ? ` (${selectedCats.length})` : ''}
          </button>

          {moreOpen && (
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Filter by category
                </span>
                <button
                  onClick={() => setSelectedCats([])}
                  className="text-xs font-semibold text-sage hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {moreFilterCategories.map((c) => (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(c)}
                      onChange={() => toggleCat(c)}
                      className="h-4 w-4 rounded border-gray-300 accent-sage"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="mt-5 text-sm text-gray-500">
        {loading
          ? 'Loading resources…'
          : `${filtered.length} ${filtered.length === 1 ? 'resource' : 'resources'} found`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading resources…
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">No resources found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different search term or category.
          </p>
        </div>
      )}
    </div>
  )
}
