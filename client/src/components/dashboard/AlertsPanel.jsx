import { useAlerts } from '../../hooks/useDashboardData';
import Skeleton from '../ui/Skeleton';
import Badge from '../ui/Badge';
import { AlertTriangle } from 'lucide-react';

export default function AlertsPanel() {
  const { data, isLoading, isError } = useAlerts();
  const urgentCount = data?.filter((a) => a.tone === 'danger').length ?? 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Alerts &amp; exceptions</h2>
        {!isLoading && data && <Badge tone="danger">{urgentCount} urgent</Badge>}
      </div>

      {isError && <p className="text-sm text-red">Couldn't load alerts.</p>}

      <ul className="flex flex-col gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </li>
          ))
          : (data || []).map((alert, i) => {
            const toneClass =
              alert.tone === 'danger' ? 'bg-red-soft text-red'
                : alert.tone === 'warn' ? 'bg-amber-soft text-amber'
                  : 'bg-primary-soft text-primary';
            return (
              <li key={alert.id} className="flex gap-3 animate-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{alert.title}</p>
                  <p className="text-xs text-ink-muted">{alert.detail} · {alert.time}</p>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
