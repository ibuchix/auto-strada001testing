
/**
 * Loading Spinner Component
 * Created: 2025-05-29
 * Updated: 2025-05-30 - Fixed import for cn utility
 */

import React from "react";
import { cn } from "@/utils/cn";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export const LoadingSpinner = ({ 
  className, 
  size = "md", 
  color = "border-primary", 
  ...props 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-b-transparent", 
        sizeClasses[size],
        color,
        className
      )}
      {...props}
    />
  );
};
