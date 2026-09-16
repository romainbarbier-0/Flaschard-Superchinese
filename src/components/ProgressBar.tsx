export default function ProgressBar({
  value,
  className = '',
  trackClassName = 'bg-black/10',
  barClassName = 'bg-accent',
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full rounded-full overflow-hidden ${trackClassName} ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
