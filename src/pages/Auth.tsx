import { useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold text-ink">Configuration manquante</h1>
          <p className="text-sm text-muted">
            Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ne sont pas définies. Copie
            .env.example vers .env.local et renseigne ton projet Supabase.
          </p>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Compte créé. Vérifie tes emails si une confirmation est requise, puis connecte-toi.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-ink">Flashcards</h1>
          <p className="text-sm text-muted mt-1">
            {mode === 'signin' ? 'Connecte-toi pour retrouver tes mots.' : 'Crée ton compte.'}
          </p>
        </div>

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl bg-card px-4 py-3 text-ink placeholder:text-muted outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl bg-card px-4 py-3 text-ink placeholder:text-muted outline-none"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent text-white font-bold py-3.5 disabled:opacity-60"
        >
          {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-sm text-muted py-2"
        >
          {mode === 'signin' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  );
}
