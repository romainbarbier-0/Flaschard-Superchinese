import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Shuffle,
  ArrowRight,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ProgressBar from '../components/ProgressBar';
import { countDue, ensureDefaultDeck, listAllCards, listDecks } from '../lib/api';
import type { CardWithState, Deck } from '../types';

type Tab = 'word' | 'phrase';
type Sort = 'recent' | 'alpha';

function deckStats(cards: CardWithState[]) {
  const total = cards.length;
  const enCours = cards.filter((c) => c.review && c.review.reps > 0 && c.review.state !== 2).length;
  const mastered = cards.filter((c) => c.review?.state === 2).length;
  const pct = total ? Math.round((100 * mastered) / total) : 0;
  return { total, enCours, mastered, pct };
}

export default function Home() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<CardWithState[]>([]);
  const [due, setDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('word');
  const [sort, setSort] = useState<Sort>('recent');
  const [search, setSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      await ensureDefaultDeck();
      const [d, c, dueCount] = await Promise.all([listDecks(), listAllCards(), countDue()]);
      setDecks(d);
      setCards(c);
      setDue(dueCount);
      setLoading(false);
    })();
  }, []);

  const cardsByDeck = useMemo(() => {
    const map = new Map<string, CardWithState[]>();
    for (const c of cards) {
      if (c.card_type !== tab) continue;
      const arr = map.get(c.deck_id) ?? [];
      arr.push(c);
      map.set(c.deck_id, arr);
    }
    return map;
  }, [cards, tab]);

  const visibleCards = useMemo(() => cards.filter((c) => c.card_type === tab), [cards, tab]);
  const globalStats = deckStats(visibleCards);

  const topLevel = useMemo(() => {
    const list = decks.filter((d) => !d.parent_folder_id);
    const sorted = [...list].sort((a, b) =>
      sort === 'alpha' ? a.name.localeCompare(b.name) : a.created_at.localeCompare(b.created_at),
    );
    return sorted;
  }, [decks, sort]);

  const childrenOf = (deckId: string) => decks.filter((d) => d.parent_folder_id === deckId);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return cards.filter(
      (c) => c.term.toLowerCase().includes(q) || c.translation.toLowerCase().includes(q),
    );
  }, [search, cards]);

  if (loading) {
    return <div className="min-h-screen bg-paper" />;
  }

  return (
    <div className="min-h-screen bg-paper pb-32">
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              Révision du jour
            </p>
            <h1 className="text-3xl font-extrabold text-ink -mt-0.5">Flashcards</h1>
          </div>
          <button
            onClick={() => navigate('/decks/new')}
            className="rounded-full bg-card px-4 py-2 text-sm font-semibold text-ink"
          >
            + Ajouter
          </button>
        </div>

        <div className="rounded-xl2 bg-accent text-white p-5 mb-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-wider uppercase text-white/70">
              Répétition espacée
            </p>
            <span className="text-xs font-semibold bg-white/15 rounded-full px-3 py-1">
              {due} à faire
            </span>
          </div>
          <p className="text-5xl font-extrabold mt-2">{due}</p>
          <p className="text-white/70 text-sm -mt-1">cartes à revoir</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
              <span>Maîtrise globale</span>
              <span>{globalStats.pct}%</span>
            </div>
            <ProgressBar
              value={globalStats.pct}
              trackClassName="bg-white/15"
              barClassName="bg-white"
            />
          </div>

          <button
            onClick={() => navigate('/review')}
            className="w-full mt-4 rounded-full bg-white text-accent font-bold py-3 flex items-center justify-center gap-2"
          >
            Commencer les révisions <ArrowRight size={18} />
          </button>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => navigate('/options')}
              className="flex-1 rounded-full border border-white/25 text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={15} /> Options d'étude
            </button>
            <button
              onClick={() => navigate('/review?shuffle=1')}
              className="flex-1 rounded-full border border-white/25 text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2"
            >
              <Shuffle size={15} /> Mélanger {topLevel.length} deck{topLevel.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatTile value={visibleCards.length} label="Total" />
          <StatTile value={globalStats.mastered} label="Su" />
          <StatTile value={due} label="À faire" />
        </div>

        <div className="flex bg-card rounded-full p-1 mb-4">
          <button
            onClick={() => setTab('word')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === 'word' ? 'bg-white text-ink' : 'text-muted'}`}
          >
            Mots {cards.filter((c) => c.card_type === 'word').length}
          </button>
          <button
            onClick={() => setTab('phrase')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === 'phrase' ? 'bg-white text-ink' : 'text-muted'}`}
          >
            Phrases {cards.filter((c) => c.card_type === 'phrase').length}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-card rounded-full px-4 py-2.5">
            <Search size={16} className="text-muted shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher en coréen, français..."
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted"
            />
          </div>
          <button className="rounded-full bg-card p-2.5" aria-label="Filtrer">
            <SlidersHorizontal size={16} className="text-ink" />
          </button>
          <button
            className="rounded-full bg-card p-2.5"
            aria-label="Trier"
            onClick={() => setSort(sort === 'recent' ? 'alpha' : 'recent')}
          >
            <ArrowUpDown size={16} className="text-ink" />
          </button>
        </div>

        {searchResults ? (
          <SearchResults results={searchResults} decks={decks} />
        ) : (
          <>
            <button
              onClick={() => navigate('/decks/new')}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-dashed border-muted/50 text-ink font-semibold py-3 mb-2"
            >
              <FolderPlus size={16} /> Nouveau dossier
            </button>
            <p className="text-xs text-muted text-center mb-6 px-4">
              Range tes mots par thème (cuisine, voyage...) et révise-les séparément.
            </p>

            {topLevel
              .filter((d) => childrenOf(d.id).length === 0)
              .length > 0 && (
              <Section title="Accès rapides" count={topLevel.filter((d) => childrenOf(d.id).length === 0).length}>
                <div className="rounded-2xl bg-white overflow-hidden divide-y divide-black/5">
                  {topLevel
                    .filter((d) => childrenOf(d.id).length === 0)
                    .map((d) => (
                      <DeckRow key={d.id} deck={d} cards={cardsByDeck.get(d.id) ?? []} />
                    ))}
                </div>
              </Section>
            )}

            {topLevel
              .filter((d) => childrenOf(d.id).length > 0)
              .map((folder) => {
                const kids = childrenOf(folder.id);
                const totalWords = kids.reduce(
                  (n, k) => n + (cardsByDeck.get(k.id)?.length ?? 0),
                  0,
                );
                const expanded = expandedFolders[folder.id] ?? false;
                const shown = expanded ? kids : kids.slice(0, 5);
                return (
                  <div key={folder.id} className="rounded-2xl bg-white overflow-hidden mb-5">
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center shrink-0">
                        <BookOpen size={16} className="text-ink" />
                      </div>
                      <div>
                        <p className="font-bold text-ink">{folder.name}</p>
                        <p className="text-xs text-muted">
                          {kids.length} decks · {totalWords} mots au total
                        </p>
                      </div>
                    </div>
                    <div className="divide-y divide-black/5 border-t border-black/5">
                      {shown.map((d) => (
                        <DeckRow key={d.id} deck={d} cards={cardsByDeck.get(d.id) ?? []} />
                      ))}
                    </div>
                    {kids.length > 5 && (
                      <button
                        onClick={() =>
                          setExpandedFolders((s) => ({ ...s, [folder.id]: !expanded }))
                        }
                        className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-ink py-3 border-t border-black/5"
                      >
                        {expanded ? 'Réduire' : `Voir les ${kids.length - 5} autres leçons`}
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white py-4 text-center">
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold tracking-wider text-muted uppercase">{title}</p>
        <span className="text-xs font-semibold bg-card rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function DeckRow({ deck, cards }: { deck: Deck; cards: CardWithState[] }) {
  const { total, enCours, pct } = deckStats(cards);
  return (
    <Link to={`/decks/${deck.id}`} className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-base shrink-0">
        {deck.icon ?? '📁'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{deck.name}</p>
        <p className="text-xs text-muted">
          {total} mot{total !== 1 ? 's' : ''} · {enCours} en cours
        </p>
      </div>
      <div className="w-16 shrink-0">
        <p className="text-xs font-semibold text-ink text-right mb-1">{pct}%</p>
        <ProgressBar value={pct} />
      </div>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </Link>
  );
}

function SearchResults({ results, decks }: { results: CardWithState[]; decks: Deck[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-muted text-center py-10">Aucun résultat.</p>;
  }
  return (
    <div className="rounded-2xl bg-white overflow-hidden divide-y divide-black/5 mb-6">
      {results.map((c) => {
        const deck = decks.find((d) => d.id === c.deck_id);
        return (
          <Link
            key={c.id}
            to={`/decks/${c.deck_id}`}
            className="flex items-center justify-between px-4 py-3.5"
          >
            <div>
              <p className="font-semibold text-ink">{c.term}</p>
              <p className="text-xs text-muted">{c.translation}</p>
            </div>
            <p className="text-xs text-muted">{deck?.name}</p>
          </Link>
        );
      })}
    </div>
  );
}
