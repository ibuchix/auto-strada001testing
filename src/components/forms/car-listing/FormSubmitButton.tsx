
/**
 * Changes made:
 * - Enhanced visual hierarchy for primary submit action
 * - Improved state indicators for better user feedback
 * - Added consistent button styling across states
 */

import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";

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
  
  // Show retry button if there was an error
  if (isError) {
    return (
      <div className="flex flex-col items-center space-y-2 mt-4">
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          There was an error submitting your listing.
        </p>
        <Button 
          type="button"
          onClick={onRetry}
          variant="outline"
          className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10 font-medium"
        >
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
        className="bg-[#21CA6F] hover:bg-[#21CA6F]/90 text-white font-medium px-6 flex items-center"
        disabled
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Submitted Successfully!
      </Button>
    );
  }
  
  // Show loading button if submitting
  return (
    <Button
      type="submit"
      className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium w-full md:w-auto float-right px-6"
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          Submit Listing
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
};
