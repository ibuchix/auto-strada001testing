
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
  event_type: string;
  event_data: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
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
      // Fetch security audit logs for the last 24 hours
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (eventsError) {
        throw eventsError;
      }
      
      // Process metrics
      const failedLogins = events?.filter(e => 
        e.event_type.includes('login_failed') || e.event_type.includes('auth_failed')
      ).length || 0;
      
      const suspiciousActivities = events?.filter(e => 
        e.severity === 'high' || e.severity === 'critical'
      ).length || 0;
      
      const rateLimitHits = events?.filter(e => 
        e.event_type.includes('rate_limit')
      ).length || 0;
      
      setMetrics({
        failedLogins,
        suspiciousActivities,
        rateLimitHits,
        lastSecurityCheck: new Date()
      });
      
      setRecentEvents(events || []);
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
  
  // Real-time subscription for critical events
  useEffect(() => {
    if (!session?.user?.id || !isAdmin) return;
    
    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_audit_logs',
          filter: 'severity=eq.critical'
        },
        (payload) => {
          console.warn('Critical security event detected:', payload.new);
          // You could trigger notifications here
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
