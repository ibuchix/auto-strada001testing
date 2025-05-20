
/**
 * Loading Spinner Component
 * Created: 2025-05-29
 * Updated: 2025-05-30 - Fixed import for cn utility
 */

import React from "react";
import { cn } from "@/utils/cn";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const LoadingSpinner = ({ className, ...props }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-b-transparent", className)}
      {...props}
    />
  );
};
