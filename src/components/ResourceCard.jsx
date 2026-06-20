import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Bookmark,
  HandCoins,
  Home,
  Scale,
  Zap,
} from 'lucide-react'
import { CATEGORIES } from '../data/resources.js'
import { useSaved } from '../SavedContext.jsx'
import { matchLabel } from '../utils/matchLabel.js'

const ICONS = { HandCoins, Scale, Home, Zap }

export default function ResourceCard({ resource }) {
  const { isSaved, toggleSaved } = useSaved()
  const cat = CATEGORIES[resource.category]
  const Icon = ICONS[cat?.icon] ?? Home
  const saved = isSaved(resource.id)
  const match = matchLabel(resource.matchScore)

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-md">
      {/* Top row: icon + verified */}
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cat?.iconBg}`}>
          <Icon size={20} className={cat?.iconColor} />
        </div>
        {resource.verified && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-sage">
            <BadgeCheck size={15} />
            Verified
          </span>
        )}
      </div>

      {/* Category badge + optional AI match score */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat?.badgeClass}`}
        >
          {resource.category}
        </span>
        {match && (
          <span
            className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${match.className}`}
          >
            {match.label}
          </span>
        )}
      </div>

      {/* Name + provider */}
      <h3 className="mt-2 text-[15px] font-bold leading-snug text-gray-900">{resource.name}</h3>
      <p className="mt-0.5 text-xs text-gray-500">{resource.provider}</p>

      {/* Description */}
      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-gray-600">
        {resource.description}
      </p>

      {/* Metadata */}
      <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-xs">
        {resource.metadata && (
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700">{resource.metadata.label}:</span>
            <span className="text-gray-500">{resource.metadata.value}</span>
          </div>
        )}
        {resource.support && (
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700">Support:</span>
            <span className="text-gray-500">{resource.support}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2">
        <Link
          to={`/resources/${resource.id}`}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Details
        </Link>
        <button
          onClick={() => toggleSaved(resource.id)}
          aria-pressed={saved}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
            saved
              ? 'bg-sage-dark text-white'
              : 'bg-sage text-white hover:bg-sage-dark',
          ].join(' ')}
        >
          <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
