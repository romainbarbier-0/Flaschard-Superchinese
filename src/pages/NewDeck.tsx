import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createDeck, listDecks } from '../lib/api';
import { LANG_META } from '../lib/lang';
import type { Deck } from '../types';

const EMOJIS = ['📁', '✏️', '🍜', '✈️', '💬', '🎬', '📚', '🏠', '💼', '❤️'];

export default function NewDeck() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJIS[0]);
  const [parent, setParent] = useState('');
  const [langFrom, setLangFrom] = useState('ko');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listDecks().then(setDecks);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const deck = await createDeck({
        name: name.trim(),
        icon,
        parent_folder_id: parent || null,
        lang_from: langFrom,
      });
      navigate(`/decks/${deck.id}`);
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
        <h1 className="text-xl font-extrabold text-ink">Nouveau dossier</h1>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">Nom</label>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Cuisine, Voyage..."
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">Icône</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setIcon(e)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  icon === e ? 'bg-accent' : 'bg-card'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">Langue</label>
          <select
            value={langFrom}
            onChange={(e) => setLangFrom(e.target.value)}
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
          >
            {Object.entries(LANG_META).map(([code, m]) => (
              <option key={code} value={code}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">
            Dossier parent (optionnel)
          </label>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="w-full mt-1 rounded-xl bg-card px-4 py-3 outline-none"
          >
            <option value="">Aucun</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent text-white font-bold py-3.5 disabled:opacity-60"
        >
          Créer
        </button>
      </form>
    </div>
  );
}
