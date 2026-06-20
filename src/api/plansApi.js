import { apiCall } from './config.js'

export const plansApi = {
  list: () => apiCall('/plans'),

  generate: (situation) =>
    apiCall('/plans/generate', { method: 'POST', body: JSON.stringify({ situation }) }),

  get: (planId) => apiCall(`/plans/${planId}`),

  updatePlan: (planId, userMessage) =>
    apiCall(`/plans/${planId}/update`, {
      method: 'POST',
      body: JSON.stringify({ userMessage }),
    }),

  // Persist a single task's completion status (manual checkbox).
  updateTaskStatus: (planId, taskId, status) =>
    apiCall(`/plans/${planId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Generate a plan draft for preview (not saved). Used by "Create My Plan".
  // `messages` is the conversation history, so the draft reflects the actual
  // chat rather than only the slim {status,urgency} situation object.
  generateDraft: (situation = {}, messages = [], recommendedResourceIds = []) =>
    apiCall('/plans/draft', {
      method: 'POST',
      body: JSON.stringify({ situation, messages, recommendedResourceIds }),
    }),

  // Save a user-confirmed plan draft. Pass planId to update an existing plan.
  confirmDraft: ({ planDraft, situation = {}, planId = null }) =>
    apiCall('/plans/confirm-draft', {
      method: 'POST',
      body: JSON.stringify({ planDraft, situation, planId }),
    }),
}
