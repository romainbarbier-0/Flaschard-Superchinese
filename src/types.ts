export type CardType = 'word' | 'phrase';

// Mirrors ts-fsrs State enum: 0 New, 1 Learning, 2 Review, 3 Relearning
export type FsrsState = 0 | 1 | 2 | 3;

export interface Deck {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  name: string;
  icon: string | null;
  lang_from: string;
  lang_to: string;
  created_at: string;
}

export interface VocabCard {
  id: string;
  user_id: string;
  deck_id: string;
  card_type: CardType;
  term: string;
  reading: string | null;
  translation: string;
  example_sentence: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReviewState {
  card_id: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: FsrsState;
  last_review: string | null;
}

export interface CardWithState extends VocabCard {
  review: ReviewState | null;
}

export interface UserSettings {
  user_id: string;
  request_retention: number;
  daily_new_limit: number;
  daily_review_limit: number;
  enable_fuzz: boolean;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  request_retention: 0.9,
  daily_new_limit: 20,
  daily_review_limit: 200,
  enable_fuzz: true,
};
