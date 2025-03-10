
/**
 * Changes made:
 * - 2024-06-18: Created custom notification component for bid events
 */

import { Check, X, AlertCircle, Clock } from "lucide-react";

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface BidNotificationProps {
  type: NotificationType;
  title: string;
  description?: string;
}

export const BidNotification = ({ type, title, description }: BidNotificationProps) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="h-5 w-5 text-[#21CA6F]" />;
      case 'error':
        return <X className="h-5 w-5 text-[#DC143C]" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-[#4B4DED]" />;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{getIcon()}</div>
      <div>
        <h4 className="text-sm font-semibold text-[#222020]">{title}</h4>
        {description && (
          <p className="text-xs text-[#6A6A77] mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};
