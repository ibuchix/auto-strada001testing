
/**
 * Security Monitoring Hook
 * Created: 2025-05-30 - Monitor security events and system health
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface SecurityMetrics {
  failedLogins: number;
  suspiciousActivities: number;
  rateLimitHits: number;
  lastSecurityCheck: Date | null;
}

interface SecurityEvent {
  id: string;
  log_type: string;
  message: string;
  error_message?: string | null;
  details?: any;
  created_at: string;
}

export const useSecurityMonitoring = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLogins: 0,
    suspiciousActivities: 0,
    rateLimitHits: 0,
    lastSecurityCheck: null
  });
  
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const session = auth?.session;
  const isAdmin = session?.user?.user_metadata?.role === 'admin';
  
  const fetchSecurityMetrics = async () => {
    if (!session?.user?.id || !isAdmin) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch system logs for the last 24 hours (using existing system_logs table)
      const { data: events, error: eventsError } = await supabase
        .from('system_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (eventsError) {
        throw eventsError;
      }
      
      // Process metrics from system logs
      const failedLogins = events?.filter(e => 
        e.log_type && (
          e.log_type.includes('login_failed') || 
          e.log_type.includes('auth_failed') ||
          e.error_message !== null
        )
      ).length || 0;
      
      const suspiciousActivities = events?.filter(e => 
        e.error_message !== null || 
        (e.log_type && e.log_type.includes('security'))
      ).length || 0;
      
      const rateLimitHits = events?.filter(e => 
        e.log_type && e.log_type.includes('rate_limit')
      ).length || 0;
      
      setMetrics({
        failedLogins,
        suspiciousActivities,
        rateLimitHits,
        lastSecurityCheck: new Date()
      });
      
      // Transform system_logs to SecurityEvent format
      const transformedEvents: SecurityEvent[] = events?.map(log => ({
        id: log.id,
        log_type: log.log_type || 'unknown',
        message: log.message || 'No message',
        error_message: log.error_message,
        details: log.details,
        created_at: log.created_at
      })) || [];
      
      setRecentEvents(transformedEvents);
      setError(null);
      
    } catch (err) {
      console.error('Failed to fetch security metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch security data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshMetrics = () => {
    setIsLoading(true);
    fetchSecurityMetrics();
  };
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchSecurityMetrics();
    
    const interval = setInterval(fetchSecurityMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.user?.id, isAdmin]);
  
  // Real-time subscription for system logs
  useEffect(() => {
    if (!session?.user?.id || !isAdmin) return;
    
    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs',
          filter: 'error_message=neq.null'
        },
        (payload) => {
          console.warn('Security event detected:', payload.new);
          fetchSecurityMetrics(); // Refresh metrics
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user?.id, isAdmin]);
  
  return {
    metrics,
    recentEvents,
    isLoading,
    error,
    refreshMetrics,
    isAdmin
  };
};
