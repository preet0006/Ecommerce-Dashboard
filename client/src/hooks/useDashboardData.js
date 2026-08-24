import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: api.getKpis,
    staleTime: 60_000,
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: api.getAlerts,
    staleTime: 30_000,
  });
}

export function useChannelMargins() {
  return useQuery({
    queryKey: ['dashboard', 'channel-margins'],
    queryFn: api.getChannelMargins,
    staleTime: 60_000,
  });
}

export function useWhatIf() {
  return useMutation({ mutationFn: api.runWhatIf });
}
