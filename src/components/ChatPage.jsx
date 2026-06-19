import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { chatApi } from '../api/chatApi.js'
import { plansApi } from '../api/plansApi.js'
import { conversationsApi } from '../api/conversationsApi.js'

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm here to help you with your housing needs. To get started, can you tell me a little about your situation? For example: are you behind on rent, facing a utility shutoff, dealing with your landlord, or in need of shelter?",
}

const PRIORITY_STYLES = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-gray-100 text-gray-600',
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommended, setRecommended] = useState([])
  const [situation, setSituation] = useState(null)
  const [planAction, setPlanAction] = useState(null) // { type, reason }
  const [planDraft, setPlanDraft] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef(null)

  // Reset to a fresh chat (no DB record is created until the first message).
  const startFresh = () => {
    setMessages([GREETING])
    setConversationId(null)
    setInput('')
    setRecommended([])
    setSituation(null)
    setPlanAction(null)
    setPlanDraft(null)
    setPreviewOpen(false)
  }

  // Load a conversation from the DB:
  //  - ?conv=<id> → that specific conversation (clicked in the sidebar)
  //  - otherwise   → the most recent conversation
  //  - ?new=true   → skip (the effect below starts a fresh chat)
  // Re-runs when the ?conv param changes so clicking a different sidebar item
  // while already on /chat loads it.
  const convParam = searchParams.get('conv')
  useEffect(() => {
    if (searchParams.get('new') === 'true') return // handled by the effect below
    let active = true
    ;(async () => {
      try {
        let target = null
        if (convParam) {
          target = await conversationsApi.get(convParam).catch(() => null)
        } else {
          const list = await conversationsApi.list().catch(() => [])
          if (Array.isArray(list) && list.length > 0) {
            target = await conversationsApi.get(list[0].id).catch(() => null)
          }
        }
        if (!active || !target?.messages?.length) return
        setConversationId(target.id)
        setMessages(target.messages.map((m) => ({ role: m.role, content: m.content })))
      } catch {
        /* keep greeting */
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convParam])

  // Handle "New Conversation": when ?new=true appears (even while already on
  // /chat), reset to a fresh chat and strip the param so a later reload doesn't
  // re-trigger it. Clearing the param re-runs this effect, which then no-ops.
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      startFresh()
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await chatApi.send(
        // Send only the dialogue (skip the static greeting for the model).
        next.filter((m, i) => !(i === 0 && m === GREETING)),
        conversationId,
      )
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
      setRecommended(res.recommendedResources || [])
      setSituation(res.situation || null)
      setPlanAction(res.planAction || null)
      setPlanDraft(res.planDraft || null)
      if (res.conversationId && res.conversationId !== conversationId) {
        setConversationId(res.conversationId)
        // A new conversation was just created — tell the sidebar to refresh so
        // it shows up immediately, without requiring navigation.
        window.dispatchEvent(new Event('hsg:conversations-changed'))
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble responding just now. Please try again in a moment.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Button visibility is driven by planAction.type alone — the draft is NOT
  // produced per-turn; it's generated fresh when the user opens the preview.
  const draftAction =
    planAction?.type === 'create_draft' || planAction?.type === 'update_draft'
      ? planAction.type
      : null

  // "Create/Update My Plan" click — generate the draft fresh, then preview it.
  const openPreview = async () => {
    setPreparing(true)
    try {
      // Pass the conversation (minus the static greeting) so the draft reflects
      // the actual chat, not just the slim {status,urgency} situation object.
      const dialogue = messages.filter((m, i) => !(i === 0 && m === GREETING))
      const draft = await plansApi.generateDraft(situation || {}, dialogue)
      setPlanDraft(draft)
      setPreviewOpen(true)
    } finally {
      setPreparing(false)
    }
  }

  const confirmPlan = async () => {
    if (!planDraft) return
    setSaving(true)
    try {
      let planId = null
      if (draftAction === 'update_draft') {
        const list = await plansApi.list().catch(() => [])
        planId = list[0]?.id || null
      }
      const saved = await plansApi.confirmDraft({ planDraft, situation: situation || {}, planId })
      if (saved?.id) localStorage.setItem('hsg_plan_id', saved.id)
      setPreviewOpen(false)
      navigate('/plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col lg:h-[calc(100vh-5rem)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Conversation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your information is private. We use it only to provide personalized guidance.
          </p>
        </div>
        {draftAction && (
          <button
            onClick={openPreview}
            disabled={preparing}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-sage px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-60"
          >
            {preparing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Preparing…
              </>
            ) : draftAction === 'update_draft' ? (
              <>
                <RefreshCw size={16} /> Update My Plan
              </>
            ) : (
              <>
                <ClipboardList size={16} /> Create My Plan
              </>
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mt-5 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-card"
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.content} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={15} className="animate-spin" /> Thinking…
          </div>
        )}

        {recommended.length > 0 && (
          <div className="rounded-xl border border-sage/20 bg-sage-light/50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sage">
              <Sparkles size={14} /> Recommended for your situation
            </div>
            <div className="mt-3 space-y-2">
              {recommended.map((r) => (
                <Link
                  key={r.id}
                  to={`/resources/${r.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors hover:border-sage/40"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">{r.name}</div>
                    <div className="truncate text-xs text-gray-500">{r.matchReason}</div>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-sage-light px-2 py-0.5 text-xs font-semibold text-sage">
                    {r.matchScore}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-2.5 shadow-card"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-sage p-2 text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-gray-400">
        We do not store sensitive personal information.
      </p>

      {previewOpen && planDraft && (
        <PlanPreview
          draft={planDraft}
          recommended={recommended}
          isUpdate={draftAction === 'update_draft'}
          saving={saving}
          onConfirm={confirmPlan}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}

function PlanPreview({ draft, recommended, isUpdate, saving, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isUpdate ? 'Review plan changes' : 'Review your plan'}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Nothing is saved until you confirm.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-light text-sage">
              <Target size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Goal</div>
              <div className="text-sm font-bold text-gray-900">{draft.goal}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {draft.riskLevel && (
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-semibold text-rose-700">
                Risk: {draft.riskLevel}
              </span>
            )}
            {draft.urgency && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">
                Urgency: {draft.urgency}
              </span>
            )}
            {draft.estimatedTimeline && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-semibold text-gray-600">
                {draft.estimatedTimeline}
              </span>
            )}
          </div>

          {draft.nextBestAction && (
            <div className="flex items-start gap-2 rounded-xl bg-sage-light/60 p-3 text-sm">
              <ArrowRight size={16} className="mt-0.5 shrink-0 text-sage" />
              <span>
                <span className="font-semibold text-gray-900">Next best action: </span>
                <span className="text-gray-700">{draft.nextBestAction}</span>
              </span>
            </div>
          )}

          {draft.summary && (
            <p className="text-sm leading-relaxed text-gray-600">{draft.summary}</p>
          )}

          {draft.tasks?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900">Tasks</h3>
              <ul className="mt-2 space-y-2">
                {draft.tasks.map((t, i) => (
                  <li key={i} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{t.title}</span>
                      {t.priority && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Low
                          }`}
                        >
                          {t.priority}
                        </span>
                      )}
                    </div>
                    {t.description && <p className="mt-0.5 text-sm text-gray-600">{t.description}</p>}
                    {t.dueDate && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} /> Due: {t.dueDate}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommended?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recommended resources</h3>
              <ul className="mt-2 space-y-1.5">
                {recommended.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-gray-800">{r.name}</span>
                    {typeof r.matchScore === 'number' && (
                      <span className="ml-3 shrink-0 rounded-full bg-sage-light px-2 py-0.5 text-xs font-semibold text-sage">
                        {r.matchScore}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {isUpdate ? 'Confirm & Update Plan' : 'Confirm & Save Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Bubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={[
          'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-sage text-white'
            : 'rounded-bl-sm bg-gray-100 text-gray-800',
        ].join(' ')}
      >
        {text}
      </div>
    </div>
  )
}
