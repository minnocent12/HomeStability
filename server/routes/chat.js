import express from 'express'
import { groqService } from '../services/groqService.js'
import { resourceService } from '../services/resourceService.js'
import { conversationService } from '../services/conversationService.js'
import { planService } from '../services/planService.js'

const router = express.Router()

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

// POST /api/chat
// body: { messages: [{ role, content }], conversationId? }
// returns: { reply, situation, recommendedResources, conversationId, planAction, planDraft }
router.post('/', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : []
  if (messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  const userId = req.user?.id || null
  // Whether the user already has a plan decides create_draft vs update_draft.
  let hasExistingPlan = false
  if (userId) {
    try {
      hasExistingPlan = (await planService.listPlans(userId)).length > 0
    } catch {
      hasExistingPlan = false
    }
  }

  const roles = messages.map((m) => m.role).join(',')
  console.log(
    `[CHAT REQUEST] messageCount=${messages.length} roles=[${roles}] conversationId=${
      req.body?.conversationId || 'null'
    } hasExistingPlan=${hasExistingPlan}`,
  )

  // Conversational + structured turn. Only `reply` is shown to the user.
  const { reply, situation, planAction, planDraft, source } = await groqService.converse(messages, {
    hasExistingPlan,
  })
  console.log(
    `[CHAT RESPONSE] source=${source} situation=${situation?.status} planAction=${planAction?.type} replyPreview=${JSON.stringify(
      (reply || '').slice(0, 80),
    )}`,
  )

  // Urgency-aware recommendations (legal/211/shelter rank first for urgent eviction).
  const recommendedResources = await resourceService.getRecommendedResources(situation, 5)

  // Ensure the draft references the same top resources shown in chat.
  if (planDraft && (!planDraft.recommendedResources || planDraft.recommendedResources.length === 0)) {
    planDraft.recommendedResources = recommendedResources.map((r) => r.id)
  }

  // Persist the conversation under the authenticated user. Only the user's
  // message and the conversational reply are stored — never JSON or the greeting.
  let conversationId = isValidUUID(req.body?.conversationId) ? req.body.conversationId : null
  if (userId) {
    try {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
      if (!conversationId) {
        const conv = await conversationService.createConversation(
          userId,
          (lastUser || 'New conversation').slice(0, 60),
        )
        conversationId = conv?.id || null
      }
      if (conversationId) {
        if (lastUser) await conversationService.addMessage(conversationId, 'user', lastUser)
        await conversationService.addMessage(conversationId, 'assistant', reply)
      }
    } catch (err) {
      console.error('[chat persist]', err.message)
    }
  }

  // `source` ('groq' | 'fallback') is exposed so clients/tests can confirm the
  // AI path was actually used rather than silently degrading to the fallback.
  res.json({ reply, situation, recommendedResources, conversationId, planAction, planDraft, source })
})

export default router
