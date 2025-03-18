
/**
 * Changes made:
 * - 2024-09-25: Created NotificationProvider component to manage and provide access to notifications
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getNotificationClass: (type: Notification['type']) => string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    getNotificationClass
  } = useNotifications(session);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        getNotificationClass
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
