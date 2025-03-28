
/**
 * Changes made:
 * - Enhanced visual hierarchy for primary submit action
 * - Improved state indicators for better user feedback
 * - Added consistent button styling across states
 * - 2028-06-15: Added micro-interactions for button states
 */

import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
  transactionStatus: string | null;
  onRetry: () => void;
  formData: any;
}

export const FormSubmitButton = ({
  isSubmitting,
  transactionStatus,
  onRetry,
  formData
}: FormSubmitButtonProps) => {
  const isPending = isSubmitting || transactionStatus === 'PENDING';
  const isSuccess = transactionStatus === 'SUCCESS';
  const isError = transactionStatus === 'ERROR';
  const [animateLoader, setAnimateLoader] = useState(false);
  
  // Add a slight delay before showing the loader for better visual effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPending) {
      timer = setTimeout(() => {
        setAnimateLoader(true);
      }, 150);
    } else {
      setAnimateLoader(false);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isPending]);
  
  // Show retry button if there was an error
  if (isError) {
    return (
      <div className="flex flex-col items-center space-y-2 mt-4 animate-fade-in">
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          There was an error submitting your listing.
        </p>
        <Button 
          type="button"
          onClick={onRetry}
          variant="outline"
          className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10 font-medium group"
        >
          <RefreshCw className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
          Try Again
        </Button>
      </div>
    );
  }
  
  // Show disabled success button if submission was successful
  if (isSuccess) {
    return (
      <Button
        type="button"
        className="bg-[#21CA6F] hover:bg-[#21CA6F]/90 text-white font-medium px-6 flex items-center animate-scale-in"
        disabled
      >
        <CheckCircle className="mr-2 h-4 w-4 animate-pulse" />
        Submitted Successfully!
      </Button>
    );
  }
  
  // Show loading button if submitting
  return (
    <Button
      type="submit"
      className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium w-full md:w-auto float-right px-6 group transition-all duration-300"
      disabled={isPending}
    >
      {isPending ? (
        <div className={`flex items-center justify-center transition-opacity duration-300 ${animateLoader ? 'opacity-100' : 'opacity-0'}`}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Submitting...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span>Submit Listing</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      )}
    </Button>
  );
};
