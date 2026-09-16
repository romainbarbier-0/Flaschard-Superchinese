import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createCard, listDecks } from '../lib/api';
import type { CardType, Deck } from '../types';

export default function AddWord() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [targetDeck, setTargetDeck] = useState(deckId ?? '');
  const [cardType, setCardType] = useState<CardType>('word');
  const [term, setTerm] = useState('');
  const [reading, setReading] = useState('');
  const [translation, setTranslation] = useState('');
  const [example, setExample] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listDecks().then((d) => {
      setDecks(d);
      if (!deckId && d.length > 0) setTargetDeck(d[0].id);
    });
  }, [deckId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim() || !translation.trim() || !targetDeck) return;
    setBusy(true);
    try {
      await createCard({
        deck_id: targetDeck,
        term: term.trim(),
        translation: translation.trim(),
        reading: reading.trim() || null,
        example_sentence: example.trim() || null,
        card_type: cardType,
      });
      navigate(`/decks/${targetDeck}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper px-5 pt-6 max-w-lg mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-ink" />
        </button>
        <h1 className="text-xl font-extrabold text-ink">Ajouter un mot</h1>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {!deckId && (
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">
              Dossier
            </label>
            <select
              value={targetDeck}
              onChange={(e) => setTargetDeck(e.target.value)}
              className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex bg-card rounded-full p-1">
          <button
            type="button"
            onClick={() => setCardType('word')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${cardType === 'word' ? 'bg-white text-ink' : 'text-muted'}`}
          >
            Mot
          </button>
          <button
            type="button"
            onClick={() => setCardType('phrase')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${cardType === 'phrase' ? 'bg-white text-ink' : 'text-muted'}`}
          >
            Phrase
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">
            {cardType === 'word' ? 'Mot' : 'Phrase'}
          </label>
          <input
            autoFocus
            required
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex : 아니다"
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">
            Prononciation (optionnel)
          </label>
          <input
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            placeholder="Ex : a-ni-da"
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">
            Traduction
          </label>
          <input
            required
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="Ex : ne pas être / non"
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">
            Exemple (optionnel)
          </label>
          <textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            rows={2}
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !targetDeck}
          className="w-full rounded-full bg-accent text-white font-bold py-3.5 disabled:opacity-60"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
}
