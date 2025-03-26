
/**
 * Changes made:
 * - Updated type handling to fix string assignment errors
 */

import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "success" | "error" | "pending" | "inactive";

interface TransactionStatusIndicatorProps {
  status: string | null;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  pendingText?: string;
  successText?: string;
  errorText?: string;
}

export const TransactionStatusIndicator = ({ 
  status, 
  className,
  showLabel = true,
  size = "md",
  pendingText = "Processing",
  successText = "Successful",
  errorText = "Failed"
}: TransactionStatusIndicatorProps) => {
  // Map status to type
  const getStatusType = (): StatusType => {
    if (!status) return "inactive";
    
    switch(status) {
      case "SUCCESS":
      case "success":
        return "success";
      case "ERROR":
      case "error":
        return "error";
      case "PENDING":
      case "pending":
        return "pending";
      default:
        return "inactive";
    }
  };
  
  const statusType = getStatusType();
  
  // Get status label
  const getStatusLabel = (): string => {
    if (!status) return "Ready";
    
    switch(statusType) {
      case "success":
        return successText;
      case "error":
        return errorText;
      case "pending":
        return pendingText;
      default:
        return "Ready";
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch(size) {
      case "sm":
        return {
          icon: "h-3 w-3",
          text: "text-xs",
          container: "gap-1 px-1.5 py-0.5"
        };
      case "lg":
        return {
          icon: "h-5 w-5",
          text: "text-sm",
          container: "gap-2 px-3 py-1.5"
        };
      default: // md
        return {
          icon: "h-4 w-4",
          text: "text-xs",
          container: "gap-1.5 px-2 py-1"
        };
    }
  };
  
  const sizeClasses = getSizeClasses();
  
  // Background and text colors based on status
  const getStatusClasses = () => {
    switch(statusType) {
      case "success":
        return "bg-green-50 text-green-700 border-green-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };
  
  // Icon based on status
  const StatusIcon = () => {
    switch(statusType) {
      case "success":
        return <CheckCircle className={cn(sizeClasses.icon)} />;
      case "error":
        return <AlertCircle className={cn(sizeClasses.icon)} />;
      case "pending":
        return <Clock className={cn(sizeClasses.icon)} />;
      default:
        return <Clock className={cn(sizeClasses.icon)} />;
    }
  };
  
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border",
      sizeClasses.container,
      getStatusClasses(),
      className
    )}>
      <StatusIcon />
      {showLabel && (
        <span className={cn(sizeClasses.text, "font-medium")}>
          {getStatusLabel()}
        </span>
      )}
    </div>
  );
};
