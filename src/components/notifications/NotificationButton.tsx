
/**
 * Changes made:
 * - 2024-09-25: Created NotificationButton component to display notification count and dropdown
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotificationContext } from '../NotificationProvider';
import { NotificationsList } from './NotificationsList';

export const NotificationButton = () => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotificationContext();
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-[#222020]" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#DC143C] text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-[350px] p-0">
        <NotificationsList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
