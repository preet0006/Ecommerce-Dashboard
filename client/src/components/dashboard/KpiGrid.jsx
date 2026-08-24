import { useKpis } from '../../hooks/useDashboardData';
import KpiCard from './KpiCard';

export default function KpiGrid() {
  const { data, isLoading, isError } = useKpis();

  if (isError) {
    return <div className="card p-4 text-sm text-red">Couldn't load KPIs. Try refreshing the page.</div>;
  }

  const items = isLoading ? Array.from({ length: 6 }) : data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map((kpi, i) => (
        <KpiCard key={kpi?.id ?? i} kpi={kpi} loading={isLoading} index={i} />
      ))}
    </div>
  );
}
