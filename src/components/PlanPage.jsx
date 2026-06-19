import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
} from 'lucide-react'
import { plansApi } from '../api/plansApi.js'
import { useResources } from '../ResourcesContext.jsx'

const PRIORITY_STYLES = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-gray-100 text-gray-600',
}

// Plan ids are UUIDs. Anything else (e.g. a stale "plan-2") is invalid and must
// never be sent to the API.
function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

export default function PlanPage() {
  const navigate = useNavigate()
  const { getById } = useResources()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [completed, setCompleted] = useState(() => new Set())
  const [updateMsg, setUpdateMsg] = useState('')
  const [updating, setUpdating] = useState(false)
  const [notice, setNotice] = useState('')

  // DB-first load: discover the active plan id from GET /api/plans (never guess
  // or construct an id), then fetch its full detail from GET /api/plans/:id.
  // If there are no plans, show the empty state — never auto-generate.
  useEffect(() => {
    loadPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Derive completed-task state from the plan's persisted task flags whenever the
  // plan changes. This reflects DB completion AND keeps the set reconciled to the
  // current task ids, so an AI update that adds/removes tasks can never leave a
  // stale id behind (which would otherwise corrupt the completion %).
  // NOTE: clicking the checkbox is session-only (not yet persisted) — see notes.
  useEffect(() => {
    const done = new Set((plan?.tasks || []).filter((t) => t.completed).map((t) => t.id))
    setCompleted(done)
  }, [plan])

  async function loadPlan() {
    setLoading(true)
    try {
      // Drop any stale/invalid stored id (e.g. a legacy "plan-2") so it can
      // never be sent to the API.
      const storedId = localStorage.getItem('hsg_plan_id')
      if (storedId && !isValidUUID(storedId)) {
        localStorage.removeItem('hsg_plan_id')
      }
      const validStoredId = isValidUUID(localStorage.getItem('hsg_plan_id'))
        ? localStorage.getItem('hsg_plan_id')
        : null

      const list = await plansApi.list().catch(() => [])
      if (!Array.isArray(list) || list.length === 0) {
        // No plans for this user — show the empty state. Do NOT auto-generate.
        localStorage.removeItem('hsg_plan_id')
        setPlan(null)
        return
      }

      // Prefer a just-created plan if it's actually in the list; else newest.
      const activeId = list.some((p) => p.id === validStoredId) ? validStoredId : list[0].id
      const p = await plansApi.get(activeId).catch(() => null)
      if (p?.id) localStorage.setItem('hsg_plan_id', p.id)
      setPlan(p || null)
    } finally {
      setLoading(false)
    }
  }

  const createPlanExplicitly = async () => {
    setCreating(true)
    try {
      // Explicit user action only — generate with whatever minimal situation we
      // have, persist via the API, then render the saved DB response.
      const p = await plansApi.generate({ status: 'eviction_risk', income: 'low' })
      if (p?.id) localStorage.setItem('hsg_plan_id', p.id)
      setPlan(p)
    } finally {
      setCreating(false)
    }
  }

  const toggleTask = (id) => {
    if (!plan) return
    const willComplete = !completed.has(id)
    // Optimistic: flip the checkbox instantly.
    setCompleted((prev) => {
      const next = new Set(prev)
      if (willComplete) next.add(id)
      else next.delete(id)
      return next
    })
    setNotice('')
    // Persist to the same plan_tasks.status the AI update path uses.
    plansApi
      .updateTaskStatus(plan.id, id, willComplete ? 'completed' : 'pending')
      .catch(() => {
        // Roll back the optimistic change if it didn't save.
        setCompleted((prev) => {
          const next = new Set(prev)
          if (willComplete) next.delete(id)
          else next.add(id)
          return next
        })
        setNotice("Couldn't save that change — please try again.")
      })
  }

  const tasks = plan?.tasks || []
  const completion = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((completed.size / tasks.length) * 100)
  }, [completed, tasks.length])

  const submitUpdate = async () => {
    const msg = updateMsg.trim()
    if (!msg || updating || !plan) return
    setUpdating(true)
    setNotice('')
    try {
      const result = await plansApi.updatePlan(plan.id, msg)
      setPlan(result.plan)
      setNotice(result.explanation || 'Your plan has been reviewed.')
      setUpdateMsg('')
    } catch {
      setNotice('Could not update the plan right now. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-2 py-20 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" /> Loading your plan…
      </div>
    )
  }

  // Empty state — no plan exists yet. We never auto-generate; the user creates
  // a plan intentionally (via Chat → "Create My Plan", or the button below).
  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">My Plan</h1>
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white py-16 px-6 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-light text-sage">
            <Target size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">No plan yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
            Start a conversation with the Housing Stability Guide and tell us about your
            situation. Once we understand your needs, we&apos;ll create a personalized housing
            stability plan.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
            >
              <MessageSquarePlus size={16} /> Go to Chat
            </button>
            <button
              onClick={createPlanExplicitly}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Create Plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  const recommended = (plan.recommendedResources || [])
    .map((id) => getById(id))
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">My Plan</h1>
      <p className="mt-1 text-sm text-gray-500">
        A personalized action plan based on your situation, updated as things change.
      </p>

      {/* Goal + key fields */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-light text-sage">
            <Target size={20} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Current Goal
            </div>
            <h2 className="text-lg font-bold text-gray-900">{plan.goal}</h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Risk Level" value={plan.riskLevel} tone={plan.riskLevel === 'High' ? 'danger' : 'normal'} />
          <Stat label="Urgency" value={plan.urgency} tone={plan.urgency === 'Immediate' ? 'danger' : 'normal'} />
          <Stat label="Timeline" value={plan.estimatedTimeline} />
          <Stat label="Completion" value={`${completion}%`} tone="good" />
        </div>

        {plan.nextBestAction && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-sage-light/60 p-3.5 text-sm">
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-sage" />
            <span>
              <span className="font-semibold text-gray-900">Next best action: </span>
              <span className="text-gray-700">{plan.nextBestAction}</span>
            </span>
          </div>
        )}

        {plan.summary && <p className="mt-4 text-sm leading-relaxed text-gray-600">{plan.summary}</p>}

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-sage transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </section>

      {/* Tasks */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Your Tasks</h3>
          <span className="text-xs text-gray-500">
            {completed.size} of {tasks.length} completed
          </span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {tasks.map((task) => {
            const done = completed.has(task.id)
            return (
              <li
                key={task.id}
                className={[
                  'flex items-start gap-3 rounded-xl border p-3.5 transition-colors',
                  done ? 'border-sage/30 bg-sage-light/40' : 'border-gray-200 bg-white',
                ].join(' ')}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 shrink-0 text-sage"
                  aria-pressed={done}
                  aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {done ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-gray-300" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'text-sm font-semibold',
                        done ? 'text-gray-400 line-through' : 'text-gray-900',
                      ].join(' ')}
                    >
                      {task.title}
                    </span>
                    {task.priority && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Low
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-0.5 text-sm text-gray-600">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} /> Due: {task.dueDate}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Recommended resources */}
      {recommended.length > 0 && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          <h3 className="text-sm font-bold text-gray-900">Recommended Resources</h3>
          <div className="mt-4 space-y-2">
            {recommended.map((r) => (
              <Link
                key={r.id}
                to={`/resources/${r.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:border-sage/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">{r.name}</div>
                  <div className="truncate text-xs text-gray-500">
                    {plan.whyResources?.[r.id] || r.provider}
                  </div>
                </div>
                <ArrowRight size={16} className="ml-3 shrink-0 text-gray-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Update plan */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-sage" />
          <h3 className="text-sm font-bold text-gray-900">Update Your Plan</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Something change? Tell us — your plan adjusts to your new circumstances.
        </p>

        {notice && (
          <div className="mt-3 rounded-lg bg-sage-light/60 px-3.5 py-2.5 text-sm text-gray-700">
            {notice}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitUpdate()
          }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5"
        >
          <input
            value={updateMsg}
            onChange={(e) => setUpdateMsg(e.target.value)}
            placeholder="e.g. I found a new job and caught up on rent"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={updating || !updateMsg.trim()}
            className="rounded-lg bg-sage p-2 text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
            aria-label="Submit plan update"
          >
            {updating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </section>
    </div>
  )
}

function Stat({ label, value, tone = 'normal' }) {
  const toneClass =
    tone === 'danger' ? 'text-rose-600' : tone === 'good' ? 'text-sage' : 'text-gray-900'
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${toneClass}`}>{value || '—'}</div>
    </div>
  )
}
