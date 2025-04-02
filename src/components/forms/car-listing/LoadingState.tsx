
/**
 * Loading state component for form 
 * Created 2028-05-15: Provides consistent loading UI for form states
 */

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Loading form..." }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-48">
      <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
};
