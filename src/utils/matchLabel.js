// Maps an internal matchScore (kept in the data) to a user-facing label + badge
// styling. Returns null when the score is too low to show a label at all.
//   90-99 → "Strong Match" (sage green)
//   75-89 → "Good Match"   (lighter green)
//   60-74 → "Relevant"     (gray)
//   < 60  → null (no badge)
export function matchLabel(score) {
  if (typeof score !== 'number') return null
  if (score >= 90) return { label: 'Strong Match', className: 'bg-sage text-white' }
  if (score >= 75) return { label: 'Good Match', className: 'bg-sage-light text-sage' }
  if (score >= 60) return { label: 'Relevant', className: 'bg-gray-100 text-gray-600' }
  return null
}
