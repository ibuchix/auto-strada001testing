import { useRealtimeBids } from '@/hooks/useRealtimeBids';

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize real-time subscriptions
  useRealtimeBids();

  return <>{children}</>;
};