import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
}

export const FormSubmitButton = ({ isSubmitting }: FormSubmitButtonProps) => {
  return (
    <div className="sticky bottom-0 bg-white p-4 shadow-lg rounded-t-lg border-t">
      <Button
        type="submit"
        className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-semibold py-4 text-lg rounded-md transition-all duration-200 ease-in-out"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting...</span>
          </div>
        ) : (
          "Submit Listing"
        )}
      </Button>
    </div>
  );
};