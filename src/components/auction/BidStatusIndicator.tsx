
/**
 * Changes made:
 * - 2024-06-18: Created new component for visual bid status feedback
 */

import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type BidStatus = 'active' | 'outbid' | 'pending' | 'rejected' | 'won' | 'lost' | null;

interface BidStatusIndicatorProps {
  status: BidStatus;
  className?: string;
  showFullAlert?: boolean;
}

export const BidStatusIndicator = ({ 
  status, 
  className,
  showFullAlert = false 
}: BidStatusIndicatorProps) => {
  
  if (!status) return null;
  
  const getStatusConfig = (status: BidStatus) => {
    switch (status) {
      case 'active':
        return {
          icon: <Check className="h-4 w-4" />,
          color: 'bg-[#21CA6F]/10 text-[#21CA6F] border-[#21CA6F]/20',
          title: 'Highest Bid',
          description: 'Your bid is currently the highest'
        };
      case 'outbid':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20',
          title: 'Outbid',
          description: 'Your bid has been exceeded by another bidder'
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-[#4B4DED]/10 text-[#4B4DED] border-[#4B4DED]/20',
          title: 'Pending',
          description: 'Your bid is being processed'
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20',
          title: 'Rejected',
          description: 'Your bid was rejected'
        };
      case 'won':
        return {
          icon: <Check className="h-4 w-4" />,
          color: 'bg-[#21CA6F]/10 text-[#21CA6F] border-[#21CA6F]/20',
          title: 'Auction Won',
          description: 'Congratulations! You won this auction'
        };
      case 'lost':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20',
          title: 'Auction Lost',
          description: 'This auction has ended with another winner'
        };
      default:
        return {
          icon: null,
          color: 'bg-gray-100 text-gray-500 border-gray-200',
          title: 'Unknown',
          description: 'Bid status unknown'
        };
    }
  };
  
  const config = getStatusConfig(status);
  
  if (showFullAlert) {
    return (
      <Alert className={cn(config.color, "animate-fade-in", className)}>
        {config.icon}
        <AlertTitle>{config.title}</AlertTitle>
        <AlertDescription>{config.description}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 animate-fade-in",
      config.color,
      className
    )}>
      {config.icon}
      <span>{config.title}</span>
    </div>
  );
};
