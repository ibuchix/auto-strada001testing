
/**
 * Changes made:
 * - 2024-09-26: Created NotificationsList component to display user notifications
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Check, 
  X, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationContext } from '../NotificationProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/hooks/useNotifications';

interface NotificationsListProps {
  onClose: () => void;
}

export const NotificationsList = ({ onClose }: NotificationsListProps) => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    getNotificationClass,
    isLoading 
  } = useNotificationContext();
  
  const [hoveredNotification, setHoveredNotification] = useState<string | null>(null);
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate if there's an action URL
    if (notification.action_url) {
      onClose();
      navigate(notification.action_url);
    }
  };
  
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-[#21CA6F]" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-[#DC143C]" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-[#4B4DED]" />;
    }
  };
  
  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-semibold text-[#222020]">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm bg-[#DC143C] text-white rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </h3>
        
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => markAllAsRead()}
            className="text-xs hover:text-[#4B4DED]"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#6A6A77]">
            <span className="text-sm">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#6A6A77]">
            <Bell className="h-10 w-10 text-[#6A6A77] opacity-20 mb-2" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  relative p-4 hover:bg-gray-50 cursor-pointer transition-colors
                  ${!notification.is_read ? 'bg-[#EFEFFD]/30' : ''}
                `}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={() => setHoveredNotification(notification.id)}
                onMouseLeave={() => setHoveredNotification(null)}
              >
                <div className="flex">
                  <div className="mr-3">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-[#222020]' : 'text-[#222020]/80'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-xs mt-0.5 ${!notification.is_read ? 'text-[#6A6A77]' : 'text-[#6A6A77]/80'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-[#6A6A77]/60 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {!notification.is_read && hoveredNotification === notification.id && (
                  <button
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="h-3 w-3 text-[#21CA6F]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
