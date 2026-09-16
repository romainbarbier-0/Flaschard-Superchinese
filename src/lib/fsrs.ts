import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card as FsrsCard,
  type RecordLogItem,
} from 'ts-fsrs';
import type { ReviewState, UserSettings } from '../types';

/**
 * FSRS (Free Spaced Repetition Scheduler) is the algorithm behind Anki's
 * modern scheduler and consistently outperforms SM-2 in published benchmarks
 * (fewer reviews for the same retention, or higher retention for the same
 * workload). We ship it with the community-recommended defaults:
 *  - request_retention 0.9: the sweet spot between memory strength and
 *    daily review load; Anki itself defaults new profiles to this value.
 *  - enable_fuzz: adds small randomness to intervals so cards don't clump
 *    on the same day.
 *  - enable_short_term: keeps same-day learning/relearning steps for cards
 *    just introduced or just forgotten, instead of jumping straight to
 *    multi-day intervals.
 *  - maximum_interval 3650 days (10y): plenty for vocabulary, avoids
 *    absurdly long gaps a smaller dataset could produce.
 * The default 19-weight parameter set was trained on a large aggregate of
 * real Anki review logs. Once a user has a few hundred reviews logged here,
 * those logs (review_logs table) are already in the exact shape needed to
 * run the official FSRS optimizer and swap in personalized weights.
 */
export function buildScheduler(settings: Pick<UserSettings, 'request_retention' | 'enable_fuzz'>) {
  const params = generatorParameters({
    request_retention: settings.request_retention,
    enable_fuzz: settings.enable_fuzz,
    enable_short_term: true,
    maximum_interval: 3650,
  });
  return fsrs(params);
}

export { Rating, State };
export type { RecordLogItem };

export function newCardState(): FsrsCard {
  return createEmptyCard();
}

export function toFsrsCard(state: ReviewState | null): FsrsCard {
  if (!state) return createEmptyCard();
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsed_days,
    scheduled_days: state.scheduled_days,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as State,
    last_review: state.last_review ? new Date(state.last_review) : undefined,
  };
}

export function fromFsrsCard(cardId: string, userId: string, card: FsrsCard): ReviewState {
  return {
    card_id: cardId,
    user_id: userId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as ReviewState['state'],
    last_review: card.last_review ? card.last_review.toISOString() : null,
  } as ReviewState;
}

/** All four grading outcomes for the current card, keyed by FSRS Rating. */
export function previewGrades(
  settings: Pick<UserSettings, 'request_retention' | 'enable_fuzz'>,
  current: ReviewState | null,
  now: Date = new Date(),
): Record<number, RecordLogItem> {
  const scheduler = buildScheduler(settings);
  const card = toFsrsCard(current);
  return scheduler.repeat(card, now) as unknown as Record<number, RecordLogItem>;
}

/** Human-friendly interval label ("10 min", "3 j", "2 mois"...) for a scheduled card. */
export function formatInterval(due: Date, now: Date = new Date()): string {
  const ms = due.getTime() - now.getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} j`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mois`;
  const years = Math.round(days / 365);
  return `${years} an${years > 1 ? 's' : ''}`;
}
