import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { listCardsForDeck, listDecks } from '../lib/api';
import { langMeta } from '../lib/lang';
import type { CardWithState, Deck } from '../types';

export default function DeckDetail() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<CardWithState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId) return;
    (async () => {
      const [decks, cardList] = await Promise.all([listDecks(), listCardsForDeck(deckId)]);
      setDeck(decks.find((d) => d.id === deckId) ?? null);
      setCards(cardList);
      setLoading(false);
    })();
  }, [deckId]);

  if (loading || !deckId) return <div className="min-h-screen bg-paper" />;

  const meta = langMeta(deck?.lang_from ?? 'ko');

  return (
    <div className="min-h-screen bg-paper pb-32">
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/decks')}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft size={18} className="text-ink" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              {meta.emoji} {meta.label}
            </p>
            <h1 className="text-xl font-extrabold text-ink truncate">{deck?.name}</h1>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate(`/review?deck=${deckId}`)}
            disabled={cards.length === 0}
            className="flex-1 rounded-full bg-accent text-white font-bold py-3 disabled:opacity-50"
          >
            Réviser ce deck
          </button>
          <button
            onClick={() => navigate(`/decks/${deckId}/add`)}
            className="rounded-full bg-card px-4 flex items-center justify-center"
            aria-label="Ajouter un mot"
          >
            <Plus size={18} className="text-ink" />
          </button>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">
            Aucun mot pour l'instant. Ajoute ton premier mot avec le bouton +.
          </p>
        ) : (
          <div className="rounded-2xl bg-white overflow-hidden divide-y divide-black/5">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{c.term}</p>
                  <p className="text-xs text-muted truncate">{c.translation}</p>
                </div>
                <StateBadge state={c.review?.state ?? 0} />
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function StateBadge({ state }: { state: number }) {
  const map: Record<number, { label: string; className: string }> = {
    0: { label: 'Nouveau', className: 'bg-card text-muted' },
    1: { label: 'Apprentissage', className: 'bg-orange-100 text-orange-700' },
    2: { label: 'Su', className: 'bg-green-100 text-green-700' },
    3: { label: 'À revoir', className: 'bg-red-100 text-red-700' },
  };
  const s = map[state] ?? map[0];
  return (
    <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0 ${s.className}`}>
      {s.label}
    </span>
  );
}
