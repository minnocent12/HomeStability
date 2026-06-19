import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  LogOut,
  MessageSquarePlus,
  Phone,
  User,
} from 'lucide-react'
import { useSaved } from '../SavedContext.jsx'
import { useAuth } from '../AuthContext.jsx'
import { conversationsApi } from '../api/conversationsApi.js'

// Relative date label: "Today, 10:24 AM" | "Yesterday" | "Jun 18".
function relativeDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const NAV_ITEMS = [
  { to: '/chat?new=true', label: 'New Conversation', icon: MessageSquarePlus },
  { to: '/resources', label: 'Resource Directory', icon: LayoutGrid },
  { to: '/plan', label: 'My Plan', icon: ClipboardList },
  { to: '/saved', label: 'Saved Resources', icon: Bookmark, showCount: true },
]

export default function Sidebar({ onNavigate }) {
  const { savedCount } = useSaved()
  const { user, isAuthed, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])

  // Load the conversation list — on navigation, and whenever ChatPage signals a
  // new conversation was created (so it appears immediately, no navigation needed).
  useEffect(() => {
    let active = true
    const load = () =>
      conversationsApi
        .list()
        .then((list) => {
          if (active && Array.isArray(list)) setConversations(list)
        })
        .catch(() => {})
    load()
    window.addEventListener('hsg:conversations-changed', load)
    return () => {
      active = false
      window.removeEventListener('hsg:conversations-changed', load)
    }
  }, [location.key])

  const activeConv = searchParams.get('conv')
  const isNewChat = searchParams.get('new') === 'true'
  const onChat = location.pathname === '/chat'
  // The clicked conversation (?conv=) is active; otherwise the most recent one
  // is the active (latest-loaded) chat — but never while starting a new chat.
  const isConvActive = (c, i) =>
    onChat && !isNewChat && (activeConv ? c.id === activeConv : i === 0)

  const handleAuthAction = async () => {
    onNavigate?.()
    if (isAuthed) {
      await signOut()
      navigate('/resources')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="flex h-full w-full flex-col px-4 py-5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-light text-sage">
          <HouseMark />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-gray-900">Housing Stability Guide</div>
          <div className="text-xs text-gray-500">Atlanta</div>
        </div>
      </div>

      {/* Nav + recent conversations (scrolls if the list is long) */}
      <div className="mt-7 flex-1 min-h-0 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, showCount }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sage-light text-sage'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={isActive ? 'text-sage' : 'text-gray-400 group-hover:text-gray-600'}
                  />
                  <span className="flex-1">{label}</span>
                  {showCount && savedCount > 0 && (
                    <span className="rounded-full bg-sage px-2 py-0.5 text-[11px] font-semibold text-white">
                      {savedCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <div className="mt-6">
            <div className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Recent Conversations
            </div>
            <div className="mt-2 flex flex-col gap-0.5">
              {conversations.slice(0, 5).map((c, i) => {
                const active = isConvActive(c, i)
                return (
                  <Link
                    key={c.id}
                    to={`/chat?conv=${c.id}`}
                    onClick={onNavigate}
                    className={[
                      'group flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                      active ? 'bg-sage-light' : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <div className="min-w-0 flex-1 leading-tight">
                      <div
                        className={[
                          'truncate text-sm font-semibold',
                          active ? 'text-sage' : 'text-gray-800',
                        ].join(' ')}
                      >
                        {c.title || 'Conversation'}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {relativeDate(c.updated_at || c.created_at)}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={active ? 'text-sage' : 'text-gray-300 group-hover:text-gray-400'}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Crisis card */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <Phone size={15} className="text-rose-600" />
          Need help right away?
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-rose-700/90">
          If you are in immediate danger or need emergency shelter, please call 911.
        </p>
        <button className="mt-3 w-full rounded-lg bg-sage px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sage-dark">
          View Crisis Resources
        </button>
      </div>

      {/* User card */}
      <button
        onClick={handleAuthAction}
        className="group mt-4 flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <User size={18} />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-gray-900">
            {user?.name || 'Guest User'}
          </div>
          <div className="truncate text-xs text-gray-500">
            {isAuthed ? 'Sign out' : 'Sign in to save your plan and history'}
          </div>
        </div>
        {isAuthed && (
          <LogOut size={16} className="shrink-0 text-gray-400 group-hover:text-gray-600" />
        )}
      </button>
    </div>
  )
}

function HouseMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}
