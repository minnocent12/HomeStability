import express from 'express'
import { planService } from '../services/planService.js'

const router = express.Router()

// Plan ids are UUIDs. Reject anything else (e.g. a stale "plan-2") with a 404
// BEFORE it reaches a uuid-typed query, so Postgres never throws.
function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

// List plans for the authenticated user. Returns [] when not signed in.
router.get('/', async (req, res) => {
  try {
    res.json(await planService.listPlans(req.user?.id || null))
  } catch (err) {
    console.error('[plans:list]', err.message)
    res.status(500).json({ error: 'Could not list plans' })
  }
})

// Generate a new structured plan from a situation, scoped to the signed-in user.
// body: { situation: { status, concern, income, urgency } }
router.post('/generate', async (req, res) => {
  try {
    const situation = req.body?.situation || {}
    const plan = await planService.createPlan(situation, req.user?.id || null)
    res.json(plan)
  } catch (err) {
    console.error('[plans:generate]', err.message)
    res.status(500).json({ error: 'Could not generate plan' })
  }
})

// Generate a plan draft for preview WITHOUT saving it. The frontend calls this
// when the user clicks "Create My Plan", shows the preview, then confirms via
// /confirm-draft to persist.
// body: { situation }
router.post('/draft', async (req, res) => {
  try {
    const draft = await planService.draftPlan(req.body?.situation || {}, req.body?.messages || [])
    res.json(draft)
  } catch (err) {
    console.error('[plans:draft]', err.message)
    res.status(500).json({ error: 'Could not generate plan draft' })
  }
})

// Save a user-confirmed plan draft. Creates a new plan, or updates an existing
// one when planId is supplied. The plan is only persisted on this explicit
// confirmation — chat never auto-saves.
// body: { planDraft, situation?, planId? }
router.post('/confirm-draft', async (req, res) => {
  try {
    const { planDraft, situation = {}, planId = null } = req.body || {}
    if (!planDraft || typeof planDraft !== 'object') {
      return res.status(400).json({ error: 'planDraft is required' })
    }
    const userId = req.user?.id || null

    if (planId) {
      if (!isValidUUID(planId)) return res.status(404).json({ error: 'Plan not found' })
      const updated = await planService.updateFromDraft(planId, planDraft, situation, userId)
      if (!updated) return res.status(404).json({ error: 'Plan not found' })
      return res.json(updated)
    }

    const created = await planService.createFromDraft(planDraft, situation, userId)
    res.json(created)
  } catch (err) {
    console.error('[plans:confirm-draft]', err.message)
    res.status(500).json({ error: 'Could not save plan' })
  }
})

router.get('/:id', async (req, res) => {
  // Validate first (defense in depth: validation + try/catch).
  if (!isValidUUID(req.params.id)) {
    return res.status(404).json({ error: 'Plan not found' })
  }
  try {
    const plan = await planService.getPlan(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    res.json(plan)
  } catch (err) {
    console.error('[plans:get]', err.message)
    res.status(404).json({ error: 'Plan not found' })
  }
})

// Update an existing plan based on new information from the user.
// body: { userMessage: string }
router.post('/:id/update', async (req, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(404).json({ error: 'Plan not found' })
  }
  try {
    const result = await planService.updateFromMessage(req.params.id, req.body?.userMessage || '')
    if (result.error) return res.status(404).json(result)
    res.json(result)
  } catch (err) {
    console.error('[plans:update]', err.message)
    res.status(404).json({ error: 'Plan not found' })
  }
})

// Set a single task's completion status (the manual checkbox writes here).
// plan_tasks.status is the single source of truth, shared with the AI taskUpdate
// path. body: { status: "completed" | "pending" | "in_progress" }
const TASK_STATUSES = ['completed', 'pending', 'in_progress']
router.patch('/:planId/tasks/:taskId', async (req, res) => {
  const { planId, taskId } = req.params
  if (!isValidUUID(planId) || !isValidUUID(taskId)) {
    return res.status(404).json({ error: 'Not found' })
  }
  const { status } = req.body || {}
  if (!TASK_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  try {
    // Returns null if the task doesn't exist OR doesn't belong to this plan.
    const plan = await planService.updateTaskStatus(planId, taskId, status)
    if (!plan) return res.status(404).json({ error: 'Task not found' })
    res.json(plan)
  } catch (err) {
    console.error('[plans:taskStatus]', err.message)
    res.status(500).json({ error: 'Could not update task' })
  }
})

export default router
