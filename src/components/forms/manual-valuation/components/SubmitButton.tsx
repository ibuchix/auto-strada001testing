
/**
 * Changes made:
 * - 2028-06-15: Added micro-interactions for button states
 */

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface SubmitButtonProps {
  isSubmitting: boolean;
}

export const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  const [animateLoader, setAnimateLoader] = useState(false);
  
  // Add a slight delay before showing the loader for better visual effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitting) {
      timer = setTimeout(() => {
        setAnimateLoader(true);
      }, 150);
    } else {
      setAnimateLoader(false);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isSubmitting]);
  
  return (
    <Button
      type="submit"
      className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 h-12 group transition-all duration-300"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <div className={`flex items-center justify-center gap-2 transition-opacity duration-300 ${animateLoader ? 'opacity-100' : 'opacity-0'}`}>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Submitting...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span>Submit Valuation Request</span>
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      )}
    </Button>
  );
};
