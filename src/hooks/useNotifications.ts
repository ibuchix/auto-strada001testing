
/**
 * Changes made:
 * - 2024-09-25: Created hook for fetching and managing user notifications with Supabase real-time updates
 */

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  action_url?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
}

export const useNotifications = (session: Session | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to fetch notifications for the authenticated user
  const fetchNotifications = async () => {
    if (!session?.user) throw new Error("No authenticated user");
    
    // Using any type here as a workaround for the table not being in the types yet
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data as unknown as Notification[];
  };

  // Use the optimized query hook to fetch notifications with proper caching and error handling
  const { 
    data: fetchedNotifications,
    isLoading,
    error,
    refetch
  } = useOptimizedQuery({
    queryKey: ['notifications', session?.user?.id],
    queryFn: fetchNotifications,
    enabled: !!session?.user,
    requireAuth: true, // This ensures the query only runs if the user is authenticated
  });

  // Update local state when fetched notifications change
  useEffect(() => {
    if (fetchedNotifications) {
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);
    }
  }, [fetchedNotifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!session?.user) return;
    
    // Subscribe to changes on the notifications table for this user
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          const newNotification = payload.new as Notification;
          
          // Update state with new notification
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast(newNotification.title, {
            description: newNotification.message,
            className: getNotificationClass(newNotification.type),
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Function to mark a notification as read
  const markAsRead = async (notificationId: string) => {
    if (!session?.user) return;
    
    const { error } = await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!session?.user || unreadCount === 0) return;
    
    const { error } = await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }
    
    // Update local state
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Helper function for notification styling
  const getNotificationClass = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-[#21CA6F]/10 border-[#21CA6F]/20 text-[#21CA6F]';
      case 'error':
        return 'bg-[#DC143C]/10 border-[#DC143C]/20 text-[#DC143C]';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default:
        return 'bg-[#4B4DED]/10 border-[#4B4DED]/20 text-[#4B4DED]';
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
    getNotificationClass
  };
};
