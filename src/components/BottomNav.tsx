import { Home, GraduationCap, Layers, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', icon: Home, label: 'Accueil', end: true },
  { to: '/lecons', icon: GraduationCap, label: 'Leçons' },
  { to: '/decks', icon: Layers, label: 'Flashcards' },
  { to: '/profil', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <ul className="flex items-center gap-1 bg-ink/95 backdrop-blur rounded-full px-2 py-2 shadow-lg">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                  isActive ? 'bg-white text-ink' : 'text-white/70'
                }`
              }
              aria-label={label}
            >
              <Icon size={20} strokeWidth={2.25} />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
