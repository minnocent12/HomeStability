import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Chat with AI Assistant',
    body: 'Talk about your situation in a safe, private space. Get personalized guidance 24/7.',
  },
  {
    icon: ClipboardList,
    title: 'Create Action Plans',
    body: 'Get step-by-step plans customized to your goals and current situation.',
  },
  {
    icon: Search,
    title: 'Find Local Resources',
    body: 'Discover local programs, financial help, legal aid, and more in Atlanta.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Confidential',
    body: 'Your information stays private and is never shared.',
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] px-2 pb-16 sm:px-4">
      {/* Back */}
      <Link
        to="/resources"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage hover:underline"
      >
        <ArrowLeft size={16} /> Back to Resources
      </Link>

      {/* Hero */}
      <div className="mt-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-sage-light px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-sage">
          <Sparkles size={14} />
          AI-Powered Guidance for Atlanta Residents
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-[3.25rem]">
          Personalized housing guidance when you{' '}
          <span className="text-sage">need it most.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          Housing Stability Guide is an AI assistant that helps Atlanta residents navigate housing
          challenges, create action plans, and find local resources tailored to your situation.
        </p>
      </div>

      {/* Skyline */}
      <div className="mt-8">
        <img src="/images/skyline.png" alt="Atlanta skyline" className="w-full object-contain" />
      </div>

      {/* How we help */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center rounded-full bg-sage-light px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-sage">
          About Our Service
        </div>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">How we help</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Our AI assistant is here to support you every step of the way toward housing stability.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-card"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-light text-sage ring-1 ring-sage/10">
              <Icon size={24} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{body}</p>
          </div>
        ))}
      </div>

      {/* Closing banner */}
      <div className="relative mt-12 overflow-hidden rounded-2xl border border-sage/15 bg-sage-light/50">
        <div className="px-6 pt-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-sage">
            <Heart size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-sage">Stable housing. Stronger communities.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            We&apos;re here to help Atlanta residents build a more secure future.
          </p>
        </div>
        <div className="mt-8">
          <img
            src="/images/suburbs.png"
            alt="Neighborhood illustration"
            className="w-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}
