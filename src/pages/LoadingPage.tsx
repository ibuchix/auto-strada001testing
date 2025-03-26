
/**
 * Created: 2024-08-20
 * Loading page shown during authentication checks or data loading
 */

import { Loader2 } from "lucide-react";

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage = ({ message = "Loading application..." }: LoadingPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
      <h1 className="text-xl font-semibold text-foreground">{message}</h1>
      <p className="text-muted-foreground mt-2">Please wait while we set things up for you.</p>
    </div>
  );
};

export default LoadingPage;
