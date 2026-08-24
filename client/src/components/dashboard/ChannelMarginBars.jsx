import { useChannelMargins } from '../../hooks/useDashboardData';
import Skeleton from '../ui/Skeleton';

const SCALE_MAX = 40; // reference ceiling (%) so bars have visual headroom

export default function ChannelMarginBars() {
  const { data, isLoading, isError } = useChannelMargins();

  return (
    <div className="card p-5">
      <h2 className="section-title mb-4">Margin by channel</h2>

      {isError && <p className="text-sm text-red">Couldn't load channel data.</p>}

      <div className="flex flex-col gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          : data.map((row, i) => (
              <div key={row.channel} className="animate-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium text-ink">{row.channel}</span>
                  <span className="font-mono text-ink-muted">{row.margin}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-primary-soft overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, (row.margin / SCALE_MAX) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
