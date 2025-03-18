
/**
 * Changes made:
 * - 2024-09-25: Created NotificationsList component to display notifications in a dropdown
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, ChevronRight, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationContext } from '../NotificationProvider';

interface NotificationsListProps {
  onClose?: () => void;
}

export const NotificationsList = ({ onClose }: NotificationsListProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    getNotificationClass
  } = useNotificationContext();

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const displayNotifications = activeTab === 'unread' ? unreadNotifications : notifications;

  const handleNotificationClick = async (id: string, actionUrl?: string | null) => {
    await markAsRead(id);
    
    if (actionUrl) {
      // If there's a URL to navigate to
      window.location.href = actionUrl;
    }
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-semibold text-lg text-[#222020]">Notifications</h3>
        
        {unreadNotifications.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-xs text-[#4B4DED] font-medium"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 h-10 px-4 py-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadNotifications.length > 0 && (
              <span className="ml-1 text-xs bg-[#DC143C] text-white rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="m-0">
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-[#6A6A77]">Loading notifications...</p>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                <Bell className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm text-[#6A6A77] mt-2">
                  {activeTab === 'unread' 
                    ? "You have no unread notifications" 
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {displayNotifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                      !notification.is_read && "bg-[#EFEFFD]"
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                  >
                    <div className="flex items-start">
                      <div 
                        className={cn(
                          "h-2 w-2 mt-1.5 mr-2 rounded-full flex-shrink-0",
                          notification.is_read ? "bg-gray-300" : "bg-[#DC143C]"
                        )}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 
                            className={cn(
                              "text-sm font-medium",
                              !notification.is_read ? "text-[#222020]" : "text-[#6A6A77]"
                            )}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-xs text-[#6A6A77]">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className="text-xs text-[#6A6A77] mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.action_url && (
                          <div className="flex items-center text-[#4B4DED] text-xs mt-2">
                            <span>View details</span>
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
