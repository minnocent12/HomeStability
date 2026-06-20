import { useMemo, useState } from 'react'
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesCategory =
        activeCategory === 'All Categories' || r.category === activeCategory
      const matchesQuery =
        !q ||
        [r.name, r.category, r.provider, r.description]
          .join(' ')
          .toLowerCase()
          .includes(q)
      return matchesCategory && matchesQuery
    })
  }, [resources, query, activeCategory])

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
            defaultValue="relevant"
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
        <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
          <SlidersHorizontal size={14} />
          More Filters
        </button>
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
