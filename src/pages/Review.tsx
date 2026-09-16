import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Volume2, Mic, Pencil, ArrowRight, Check } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { gradeCard, getOrCreateSettings, listCardsForDeck, listDecks, listDueCards } from '../lib/api';
import { formatInterval, previewGrades } from '../lib/fsrs';
import { langMeta } from '../lib/lang';
import type { CardWithState, Deck, UserSettings } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Review() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const deckId = params.get('deck');
  const doShuffle = params.get('shuffle') === '1';

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [queue, setQueue] = useState<CardWithState[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [writeMode, setWriteMode] = useState(false);
  const [writeValue, setWriteValue] = useState('');
  const [writeChecked, setWriteChecked] = useState<null | boolean>(null);
  const [pronounceResult, setPronounceResult] = useState<null | boolean>(null);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const [s, allDecks] = await Promise.all([getOrCreateSettings(), listDecks()]);
      setSettings(s);
      setDecks(allDecks);
      let cards: CardWithState[];
      if (deckId) {
        const all = await listCardsForDeck(deckId);
        const now = Date.now();
        cards = all.filter((c) => !c.review || new Date(c.review.due).getTime() <= now);
      } else {
        cards = await listDueCards();
      }
      setQueue(doShuffle ? shuffle(cards) : cards);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = queue[index];
  const grades = useMemo(() => {
    if (!settings || !current) return null;
    return previewGrades(settings, current.review, new Date());
  }, [settings, current]);

  function reset() {
    setRevealed(false);
    setWriteMode(false);
    setWriteValue('');
    setWriteChecked(null);
    setPronounceResult(null);
    setListening(false);
  }

  const currentLang = useMemo(
    () => decks.find((d) => d.id === current?.deck_id)?.lang_from ?? 'ko',
    [decks, current],
  );

  function playAudio() {
    if (!current) return;
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(current.term);
    utter.lang = langMeta(currentLang).bcp47;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function startPronunciation() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !current) {
      setPronounceResult(null);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = langMeta(currentLang).bcp47;
    recognition.maxAlternatives = 3;
    recognition.onresult = (e: any) => {
      const transcripts: string[] = Array.from(e.results[0]).map((r: any) =>
        r.transcript.trim().toLowerCase(),
      );
      const target = current.term.trim().toLowerCase();
      setPronounceResult(transcripts.some((t) => t === target || t.includes(target)));
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setPronounceResult(null);
    recognition.start();
  }

  function checkWriting() {
    if (!current) return;
    const norm = (s: string) => s.trim().toLowerCase();
    setWriteChecked(norm(writeValue) === norm(current.translation));
    setRevealed(true);
  }

  async function grade(rating: 1 | 2 | 3 | 4) {
    if (!current || !settings) return;
    await gradeCard(current, rating, settings);
    if (index + 1 >= queue.length) {
      setIndex(index + 1);
    } else {
      setIndex(index + 1);
      reset();
    }
  }

  if (loading) return <div className="min-h-screen bg-paper" />;

  if (queue.length === 0) {
    return (
      <EndScreen title="Rien à réviser" subtitle="Tu es à jour, bravo !" onClose={() => navigate('/decks')} />
    );
  }

  if (index >= queue.length) {
    return (
      <EndScreen
        title="Session terminée"
        subtitle={`${queue.length} carte${queue.length > 1 ? 's' : ''} révisée${queue.length > 1 ? 's' : ''}.`}
        onClose={() => navigate('/decks')}
      />
    );
  }

  const meta = langMeta(currentLang);
  const progressPct = (index / queue.length) * 100;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="px-5 pt-6 flex items-center gap-4 max-w-lg w-full mx-auto">
        <button
          onClick={() => navigate('/decks')}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0"
          aria-label="Fermer"
        >
          <X size={18} className="text-ink" />
        </button>
        <ProgressBar value={progressPct} />
        <span className="text-sm font-semibold text-ink shrink-0">
          {index + 1}/{queue.length}
        </span>
      </div>

      <div className="flex-1 px-5 py-5 max-w-lg w-full mx-auto flex flex-col">
        <div className="flex-1 rounded-xl2 bg-card p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold tracking-widest text-muted uppercase mb-6">
            {meta.emoji} {meta.label}
          </p>

          <button
            onClick={() => setRevealed((r) => !r)}
            className="text-4xl font-extrabold text-ink mb-8 px-2 break-words"
          >
            {current.term}
          </button>

          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-6">
            <IconAction label="Écouter" onClick={playAudio}>
              <Volume2 size={22} />
            </IconAction>
            <IconAction
              label="Prononcer"
              active={listening}
              onClick={startPronunciation}
              result={pronounceResult}
            >
              <Mic size={22} />
            </IconAction>
            <IconAction label="Écrire" active={writeMode} onClick={() => setWriteMode(true)}>
              <Pencil size={22} />
            </IconAction>
          </div>

          {!revealed && writeMode && (
            <div className="w-full max-w-xs mb-2 flex gap-2">
              <input
                autoFocus
                value={writeValue}
                onChange={(e) => setWriteValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkWriting()}
                placeholder="Écris la traduction..."
                className="flex-1 rounded-xl bg-white/70 px-4 py-2.5 text-sm outline-none placeholder:text-muted"
              />
              <button
                onClick={checkWriting}
                className="rounded-xl bg-accent text-white px-4 text-sm font-semibold"
              >
                OK
              </button>
            </div>
          )}
          {!revealed && !writeMode && <p className="text-xs text-muted mt-2">Touche pour révéler</p>}

          {revealed && (
            <div className="w-full space-y-1 mt-1">
              {writeChecked !== null && (
                <p className={`text-xs font-semibold ${writeChecked ? 'text-accent' : 'text-red-600'}`}>
                  {writeChecked ? 'Correct !' : 'Pas tout à fait...'}
                </p>
              )}
              <p className="text-2xl font-bold text-accent">{current.translation}</p>
              {current.reading && <p className="text-sm text-muted">{current.reading}</p>}
              {current.example_sentence && (
                <p className="text-sm text-ink/80 italic mt-2">{current.example_sentence}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-full bg-accent text-white font-bold py-4 flex items-center justify-center gap-2"
            >
              Voir la réponse <ArrowRight size={18} />
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <RatingButton
                label="Encore"
                sub={grades ? formatInterval(grades[1].card.due) : ''}
                className="bg-red-100 text-red-700"
                onClick={() => grade(1)}
              />
              <RatingButton
                label="Difficile"
                sub={grades ? formatInterval(grades[2].card.due) : ''}
                className="bg-orange-100 text-orange-700"
                onClick={() => grade(2)}
              />
              <RatingButton
                label="Bien"
                sub={grades ? formatInterval(grades[3].card.due) : ''}
                className="bg-green-100 text-green-700"
                onClick={() => grade(3)}
              />
              <RatingButton
                label="Facile"
                sub={grades ? formatInterval(grades[4].card.due) : ''}
                className="bg-emerald-200 text-emerald-800"
                onClick={() => grade(4)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  active,
  result,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  result?: boolean | null;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
          active ? 'bg-accent text-white' : 'bg-white text-ink'
        }`}
      >
        {result === true ? <Check size={22} /> : children}
      </button>
      <span className="text-xs font-medium text-ink">{label}</span>
    </div>
  );
}

function RatingButton({
  label,
  sub,
  className,
  onClick,
}: {
  label: string;
  sub: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`rounded-2xl py-3 flex flex-col items-center ${className}`}>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-[10px] opacity-80">{sub}</span>
    </button>
  );
}

function EndScreen({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <h1 className="text-2xl font-extrabold text-ink mb-2">{title}</h1>
        <p className="text-sm text-muted mb-6">{subtitle}</p>
        <button
          onClick={onClose}
          className="w-full rounded-full bg-accent text-white font-bold py-3.5"
        >
          Retour aux decks
        </button>
      </div>
    </div>
  );
}
