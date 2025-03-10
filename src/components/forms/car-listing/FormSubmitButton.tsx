
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
  isSuccess?: boolean;
}

export const FormSubmitButton = ({ isSubmitting, isSuccess }: FormSubmitButtonProps) => {
  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 shadow-lg rounded-t-lg border-t z-50">
      <Button
        type="submit"
        className={`w-full ${isSuccess ? 'bg-[#21CA6F]' : 'bg-[#DC143C]'} hover:${isSuccess ? 'bg-[#21CA6F]/90' : 'bg-[#DC143C]/90'} text-white font-semibold py-4 text-lg rounded-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Submitting your listing...</span>
          </div>
        ) : isSuccess ? (
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
    </div>
  );
};
