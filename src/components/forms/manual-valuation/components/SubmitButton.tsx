
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";

interface SubmitButtonProps {
  isSubmitting: boolean;
}

export const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 h-12"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Submitting...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>Submit Valuation Request</span>
          <ArrowRight className="h-5 w-5" />
        </div>
      )}
    </Button>
  );
};
