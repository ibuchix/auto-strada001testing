
/**
 * Changes made:
 * - 2024-09-25: Created notification service for managing notifications in Supabase
 */

import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/hooks/useNotifications";

// Type for creating a new notification
export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export const notificationService = {
  /**
   * Create a new notification for a user
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([params])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    
    return data as Notification;
  },
  
  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    user_ids: string[], 
    notification: Omit<CreateNotificationParams, 'user_id'>
  ): Promise<boolean> {
    const notifications = user_ids.map(user_id => ({
      user_id,
      ...notification
    }));
    
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);
    
    if (error) {
      console.error('Error creating bulk notifications:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
    
    return true;
  },

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
    
    return true;
  }
};
