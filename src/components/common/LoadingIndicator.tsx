
/**
 * Changes made:
 * - 2025-07-14: Created reusable loading indicator component
 */

interface LoadingIndicatorProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingIndicator = ({ 
  message = "Loading...", 
  fullscreen = false 
}: LoadingIndicatorProps) => {
  const containerClasses = fullscreen 
    ? "min-h-screen flex items-center justify-center" 
    : "py-12 flex items-center justify-center";
    
  return (
    <div className={containerClasses}>
      <div className="animate-pulse text-center">
        <p className="text-xl">{message}</p>
      </div>
    </div>
  );
};
