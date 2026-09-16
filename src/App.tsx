import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import DeckDetail from './pages/DeckDetail';
import NewDeck from './pages/NewDeck';
import AddWord from './pages/AddWord';
import Review from './pages/Review';
import Options from './pages/Options';
import ComingSoon from './pages/ComingSoon';
import { supabaseConfigured } from './lib/supabaseClient';

function Gate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (!supabaseConfigured) return <Auth />;
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-paper" />;
  }
  if (!session) return <Auth />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/decks" replace />} />
            <Route path="/decks" element={<Home />} />
            <Route path="/decks/new" element={<NewDeck />} />
            <Route path="/decks/:deckId" element={<DeckDetail />} />
            <Route path="/decks/:deckId/add" element={<AddWord />} />
            <Route path="/review" element={<Review />} />
            <Route path="/lecons" element={<ComingSoon title="Leçons" />} />
            <Route path="/options" element={<Options />} />
            <Route path="/profil" element={<Navigate to="/options" replace />} />
            <Route path="*" element={<Navigate to="/decks" replace />} />
          </Routes>
        </HashRouter>
      </Gate>
    </AuthProvider>
  );
}
