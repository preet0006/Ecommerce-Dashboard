import Skeleton from '../ui/Skeleton';
import { formatValue } from '../../utils/format';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function KpiCard({ kpi, loading, index = 0 }) {
  if (loading) {
    return (
      <div className="kpi-card animate-enter" style={{ animationDelay: `${index * 40}ms` }}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32 mt-1" />
        <Skeleton className="h-3 w-20 mt-2" />
      </div>
    );
  }

  const { label, value, format, delta, tone } = kpi;
  const borderTone = tone === 'danger' ? 'border-l-red' : tone === 'warn' ? 'border-l-amber' : 'border-l-primary';
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const deltaColor = delta > 0 ? 'text-primary' : delta < 0 ? 'text-red' : 'text-ink-muted';

  return (
    <div className={`kpi-card border-l-4 ${borderTone} animate-enter`} style={{ animationDelay: `${index * 40}ms` }}>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <span className="stat-figure">{formatValue(value, format)}</span>
      {delta !== 0 && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${deltaColor}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {Math.abs(delta)}% vs last period
        </span>
      )}
    </div>
  );
}
