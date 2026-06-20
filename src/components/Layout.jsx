import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import RightPanel from './RightPanel.jsx'

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  // The full-width About page renders without the right panel.
  const showRightPanel = location.pathname !== '/about'

  return (
    <div className="min-h-screen bg-[#fafaf8] text-gray-800">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-light text-sage">
            <HouseMark />
          </div>
          <span className="text-sm font-bold text-gray-900">Housing Stability Guide</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Left sidebar — fixed on desktop */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[260px] shrink-0 border-r border-gray-200 bg-white">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-[280px] max-w-[85%] bg-white shadow-xl">
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>

        {/* Right sidebar — fixed on desktop (hidden on the About page) */}
        {showRightPanel && (
          <aside className="hidden xl:block sticky top-0 h-screen w-[300px] shrink-0 overflow-y-auto border-l border-gray-200 bg-[#fafaf8] px-5 py-8">
            <RightPanel />
          </aside>
        )}
      </div>
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
