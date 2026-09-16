import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getOrCreateSettings, updateSettings } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import type { UserSettings } from '../types';

export default function Options() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrCreateSettings().then(setSettings);
  }, []);

  async function save(patch: Partial<UserSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      await updateSettings(patch);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div className="min-h-screen bg-paper" />;

  return (
    <div className="min-h-screen bg-paper pb-32">
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/decks')}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
            aria-label="Retour"
          >
            <ArrowLeft size={18} className="text-ink" />
          </button>
          <h1 className="text-xl font-extrabold text-ink">Options d'étude</h1>
        </div>

        <div className="rounded-2xl bg-white p-5 space-y-6 mb-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-ink">Rétention cible</label>
              <span className="text-sm font-bold text-accent">
                {Math.round(settings.request_retention * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.8}
              max={0.97}
              step={0.01}
              value={settings.request_retention}
              onChange={(e) => save({ request_retention: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <p className="text-xs text-muted mt-1">
              Probabilité visée de te souvenir d'une carte à sa date de révision. 90% est la
              référence recommandée par FSRS/Anki : un bon équilibre entre mémorisation et nombre
              de révisions par jour. Monte-la si tu veux mieux retenir (plus de révisions), baisse-la
              pour réviser moins souvent (au prix de plus d'oublis).
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Nouvelles cartes / jour</label>
            <input
              type="number"
              min={1}
              value={settings.daily_new_limit}
              onChange={(e) => save({ daily_new_limit: Number(e.target.value) })}
              className="w-full mt-1 rounded-xl bg-card px-4 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Révisions max / jour</label>
            <input
              type="number"
              min={1}
              value={settings.daily_review_limit}
              onChange={(e) => save({ daily_review_limit: Number(e.target.value) })}
              className="w-full mt-1 rounded-xl bg-card px-4 py-2.5 outline-none"
            />
          </div>

          <label className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">
              Fuzz (variation aléatoire des intervalles)
            </span>
            <input
              type="checkbox"
              checked={settings.enable_fuzz}
              onChange={(e) => save({ enable_fuzz: e.target.checked })}
              className="w-5 h-5 accent-accent"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-white p-4 text-xs text-muted mb-5">
          Algorithme : <span className="font-semibold text-ink">FSRS</span>, le système de
          répétition espacée qui a remplacé SM-2 dans Anki. Il modélise ta mémoire (stabilité,
          difficulté) carte par carte plutôt que d'appliquer un multiplicateur fixe, ce qui réduit
          le nombre de révisions nécessaires pour un même niveau de rétention.
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-2 rounded-full border border-red-200 text-red-600 font-semibold py-3"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
        {saving && <p className="text-center text-xs text-muted mt-2">Enregistrement...</p>}
      </div>
      <BottomNav />
    </div>
  );
}
