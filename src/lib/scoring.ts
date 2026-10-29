export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
export const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))

export interface ScoreBreakdown {
  score: number
  maxScore: number
  correct: number
  incorrect: number
  unattempted: number
  accuracy: number
}

export function scoreAttempt(
  answers: { questionId: string; selected: number | null }[],
  key: Record<string, { correct: number | number[]; options: number }>,
  negativeMarking: boolean,
): ScoreBreakdown {
  let correct = 0
  let incorrect = 0
  let unattempted = 0
  for (const a of answers) {
    const q = key[a.questionId]
    if (!q || a.selected === null) {
      unattempted += 1
      continue
    }
    const isCorrect = Array.isArray(q.correct) ? q.correct.includes(a.selected) : q.correct === a.selected
    if (isCorrect) correct += 1
    else incorrect += 1
  }
  const raw = correct - (negativeMarking ? incorrect / 3 : 0)
  const maxScore = answers.length
  return {
    score: Math.max(0, Number(raw.toFixed(2))),
    maxScore,
    correct,
    incorrect,
    unattempted,
    accuracy: pct(correct, correct + incorrect),
  }
}
