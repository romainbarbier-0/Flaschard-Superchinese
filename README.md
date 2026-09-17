# Flashcards (répétition espacée)

Petite appli de flashcards de vocabulaire avec répétition espacée (SRS), pensée mobile d'abord.
Stack : Vite + React + TypeScript + Tailwind CSS, données dans Supabase (Postgres + Auth),
algorithme de planification **FSRS** via [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs).
Déployée en statique sur GitHub Pages, à l'adresse `https://romainbarbier-0.github.io/Flaschard-Superchinese/`.

## 1. Créer les tables dans Supabase (une seule fois)

1. Ouvre ton projet Supabase existant (pas besoin d'en créer un nouveau).
2. Va dans **SQL Editor** → **New query**.
3. Colle le contenu de [`supabase/schema.sql`](./supabase/schema.sql) et clique **Run**.
   Ça crée 5 tables (`decks`, `cards`, `review_state`, `review_logs`, `user_settings`),
   toutes protégées par des règles de sécurité (RLS) : chaque compte ne voit que ses propres
   données.
4. Dans **Authentication → Providers**, l'auth Email est activée par défaut : c'est celle
   utilisée par l'appli (inscription email + mot de passe). Si Supabase demande une
   confirmation par email, tu peux la désactiver dans **Authentication → Settings** pour un
   usage perso, ou juste cliquer le lien reçu par mail la première fois.

## 2. Récupérer les clés d'API

Dans **Settings → API** de ton projet Supabase, copie :
- **Project URL**
- **anon / public key** (jamais la `service_role` — celle-là reste secrète)

## 3. Développement local

```bash
cp .env.example .env.local   # puis colle l'URL et la clé anon dedans
npm install
npm run dev
```

## 4. Déploiement (GitHub Pages)

Un workflow GitHub Actions (`.github/workflows/deploy.yml`) build l'appli et la publie sur
GitHub Pages à chaque push sur `main`.

Deux réglages à faire une seule fois côté GitHub, dans les **Settings** de ce repo :

1. **Settings → Pages → Build and deployment → Source** : choisir **GitHub Actions**
   (au lieu de "Deploy from a branch"). Sans ce changement, le workflow ne peut pas publier.
2. **Settings → Secrets and variables → Actions → New repository secret**, ajouter :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Une fois ces deux étapes faites, chaque push sur `main` republie automatiquement le site à
`https://romainbarbier-0.github.io/Flaschard-Superchinese/`. Tu peux aussi déclencher un
déploiement manuellement depuis l'onglet **Actions** du repo (bouton "Run workflow").

## Pourquoi FSRS et ces réglages ?

FSRS (Free Spaced Repetition Scheduler) est l'algorithme qui a remplacé SM-2 comme moteur de
planification par défaut d'Anki depuis 2023, après des benchmarks montrant qu'il obtient un
meilleur taux de rétention pour un même nombre de révisions (ou, à rétention égale, moins de
révisions par jour), car il modélise directement la stabilité et la difficulté de chaque carte
au lieu d'appliquer un multiplicateur fixe à l'intervalle précédent.

Réglages par défaut de l'appli (modifiables dans **Options d'étude**) :
- **Rétention cible : 90 %** — la valeur de référence recommandée par le projet FSRS et reprise
  par Anki : bon compromis entre mémorisation et charge de révisions quotidienne.
- **Fuzz activé** — ajoute un petit aléa aux intervalles pour éviter que des cartes apprises le
  même jour ne reviennent systématiquement ensemble.
- **Étapes court terme activées** — les cartes nouvelles ou ratées repassent d'abord par des
  paliers courts (minutes/heures) avant de rejoindre la planification long terme.
- **Poids par défaut** — les 19 poids FSRS fournis par la librairie, entraînés sur un très grand
  volume de vraies révisions Anki. Chaque révision est enregistrée dans `review_logs`, exactement
  dans le format attendu par l'optimiseur officiel FSRS ; une fois quelques centaines de
  révisions accumulées, ces poids pourront être ré-optimisés pour coller à ta propre mémoire.
