
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { TransactionStatusIndicator } from "@/components/transaction/TransactionStatusIndicator";
import { TransactionStatus } from "@/services/supabase/transactionService";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
  isSuccess?: boolean;
  transactionStatus?: TransactionStatus | null;
}

export const FormSubmitButton = ({ 
  isSubmitting, 
  isSuccess, 
  transactionStatus 
}: FormSubmitButtonProps) => {
  // Determine the button state based on transaction status or legacy props
  const isPending = transactionStatus === TransactionStatus.PENDING || isSubmitting;
  const isCompleted = transactionStatus === TransactionStatus.SUCCESS || isSuccess;
  
  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 shadow-lg rounded-t-lg border-t z-50">
      <Button
        type="submit"
        className={`w-full ${isCompleted ? 'bg-[#21CA6F]' : 'bg-[#DC143C]'} hover:${isCompleted ? 'bg-[#21CA6F]/90' : 'bg-[#DC143C]/90'} text-white font-semibold py-4 text-lg rounded-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
        disabled={isPending}
      >
        {isPending ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Submitting your listing...</span>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Listing Submitted Successfully</span>
          </div>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Submit Listing
          </span>
        )}
      </Button>
      
      {transactionStatus && (
        <div className="mt-2 flex justify-center">
          <TransactionStatusIndicator 
            status={transactionStatus} 
            pendingText="Processing submission..." 
            successText="Submission successful!"
            errorText="Submission failed"
          />
        </div>
      )}
    </div>
  );
};
