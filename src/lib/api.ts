import { supabase } from './supabaseClient';
import { buildScheduler, fromFsrsCard, toFsrsCard } from './fsrs';
import { DEFAULT_SETTINGS } from '../types';
import type { CardWithState, Deck, ReviewState, UserSettings, VocabCard } from '../types';

export async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export async function getOrCreateSettings(): Promise<UserSettings> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as UserSettings;

  const fresh: UserSettings = { user_id: userId, ...DEFAULT_SETTINGS };
  const { error: insertError } = await supabase.from('user_settings').insert(fresh);
  if (insertError) throw insertError;
  return fresh;
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('user_settings').update(patch).eq('user_id', userId);
  if (error) throw error;
}

export async function listDecks(): Promise<Deck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Deck[];
}

export async function createDeck(input: {
  name: string;
  icon?: string | null;
  parent_folder_id?: string | null;
  lang_from?: string;
  lang_to?: string;
}): Promise<Deck> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('decks')
    .insert({
      user_id: userId,
      name: input.name,
      icon: input.icon ?? null,
      parent_folder_id: input.parent_folder_id ?? null,
      lang_from: input.lang_from ?? 'ko',
      lang_to: input.lang_to ?? 'fr',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Deck;
}

/** Creates the "Ma liste personnelle" default deck the very first time a user opens the app. */
export async function ensureDefaultDeck(): Promise<void> {
  const decks = await listDecks();
  if (decks.length > 0) return;
  await createDeck({ name: 'Ma liste personnelle', icon: '✏️' });
}

export async function listAllCards(): Promise<CardWithState[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*, review:review_state(*)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    review: Array.isArray(row.review) ? (row.review[0] ?? null) : row.review,
  })) as CardWithState[];
}

export async function listCardsForDeck(deckId: string): Promise<CardWithState[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*, review:review_state(*)')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    review: Array.isArray(row.review) ? (row.review[0] ?? null) : row.review,
  })) as CardWithState[];
}

export async function createCard(input: {
  deck_id: string;
  term: string;
  translation: string;
  reading?: string | null;
  example_sentence?: string | null;
  notes?: string | null;
  card_type?: 'word' | 'phrase';
}): Promise<VocabCard> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('cards')
    .insert({
      user_id: userId,
      deck_id: input.deck_id,
      term: input.term,
      translation: input.translation,
      reading: input.reading ?? null,
      example_sentence: input.example_sentence ?? null,
      notes: input.notes ?? null,
      card_type: input.card_type ?? 'word',
    })
    .select('*')
    .single();
  if (error) throw error;

  // Seed FSRS state so the card immediately shows up in due queues.
  const initialState = fromFsrsCard(data.id, userId, toFsrsCard(null));
  const { error: stateError } = await supabase.from('review_state').insert(initialState);
  if (stateError) throw stateError;

  return data as VocabCard;
}

/** Cards due now (or new) across all of the user's decks, oldest-due first. */
export async function listDueCards(limit = 200): Promise<CardWithState[]> {
  const nowIso = new Date().toISOString();
  // Filtering must start from review_state: PostgREST embedded-resource
  // filters only narrow the embedded rows, they don't restrict the parent
  // query, so querying from `cards` with a `.lte('review.due', ...)` filter
  // would silently return every card instead of just the due ones.
  const { data, error } = await supabase
    .from('review_state')
    .select('*, card:cards(*)')
    .lte('due', nowIso)
    .order('due', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as any[])
    .filter((row) => row.card)
    .map((row) => ({ ...row.card, review: { ...row, card: undefined } })) as CardWithState[];
}

export async function countDue(): Promise<number> {
  const nowIso = new Date().toISOString();
  const { count, error } = await supabase
    .from('review_state')
    .select('card_id', { count: 'exact', head: true })
    .lte('due', nowIso);
  if (error) throw error;
  return count ?? 0;
}

/** Apply an FSRS rating to a card: persists new scheduling state + append-only log. */
export async function gradeCard(
  card: CardWithState,
  rating: 1 | 2 | 3 | 4,
  settings: Pick<UserSettings, 'request_retention' | 'enable_fuzz'>,
): Promise<ReviewState> {
  const userId = await getUserId();
  const scheduler = buildScheduler(settings);
  const now = new Date();
  const before = toFsrsCard(card.review);
  const result = scheduler.repeat(before, now) as any;
  const outcome = result[rating];
  const newState = fromFsrsCard(card.id, userId, outcome.card);

  const { error: upsertError } = await supabase
    .from('review_state')
    .upsert({ ...newState, user_id: userId });
  if (upsertError) throw upsertError;

  const log = outcome.log;
  const { error: logError } = await supabase.from('review_logs').insert({
    card_id: card.id,
    user_id: userId,
    rating,
    state: log.state,
    due: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    last_elapsed_days: log.last_elapsed_days,
    scheduled_days: log.scheduled_days,
    review: log.review.toISOString(),
  });
  if (logError) throw logError;

  return newState;
}
