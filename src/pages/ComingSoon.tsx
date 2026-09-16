import BottomNav from '../components/BottomNav';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-paper pb-28">
      <div className="px-5 pt-16 text-center">
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted mt-2">Bientôt disponible.</p>
      </div>
      <BottomNav />
    </div>
  );
}
