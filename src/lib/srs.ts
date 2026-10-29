import type { Flashcard } from '../types'
import { addDays, iso, todayISO } from './date'

export function reviewCard(card: Flashcard, quality: 0 | 1 | 2 | 3 | 4 | 5): Flashcard {
  let { ease, interval, lapses } = card
  if (quality < 3) {
    lapses += 1
    interval = 1
    ease = Math.max(1.3, ease - 0.2)
  } else {
    if (interval === 0) interval = 1
    else if (interval === 1) interval = 3
    else interval = Math.round(interval * ease)
    ease = Math.min(2.8, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  }
  return {
    ...card,
    ease: Number(ease.toFixed(2)),
    interval,
    lapses,
    reviews: card.reviews + 1,
    due: iso(addDays(todayISO(), interval)),
  }
}

export const dueCards = (cards: Flashcard[]) => cards.filter(c => c.due <= todayISO())
