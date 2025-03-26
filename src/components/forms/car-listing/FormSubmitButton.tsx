
/**
 * Changes made:
 * - 2024-06-03: Created FormSubmitButton to handle form submission with transaction status
 */

import { Button } from "@/components/ui/button";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { CarListingFormData } from "@/types/forms";
import { ArrowRight, Loader2 } from "lucide-react";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
  transactionStatus: TransactionStatus | null;
  onRetry: () => void;
  diagnosticId?: string;
  formData: CarListingFormData;
}

export const FormSubmitButton = ({
  isSubmitting,
  transactionStatus,
  onRetry,
  diagnosticId,
  formData
}: FormSubmitButtonProps) => {
  const isPending = isSubmitting || transactionStatus === 'PENDING';
  const isSuccess = transactionStatus === 'SUCCESS';
  const isError = transactionStatus === 'ERROR';
  
  // Show retry button if there was an error
  if (isError) {
    return (
      <div className="flex flex-col items-center space-y-2 mt-4">
        <p className="text-sm text-red-600">
          There was an error submitting your listing.
        </p>
        <Button 
          type="button"
          onClick={onRetry}
          variant="outline"
          className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
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
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled
      >
        Submitted Successfully!
      </Button>
    );
  }
  
  // Show loading button if submitting
  return (
    <Button
      type="submit"
      className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full md:w-auto float-right"
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
