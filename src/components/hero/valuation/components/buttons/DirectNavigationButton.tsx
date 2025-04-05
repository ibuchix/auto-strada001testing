
/**
 * DirectNavigationButton Component
 * - Created 2025-04-05: Simplified button for valuation navigation
 * - Updated 2025-04-06: Added onContinue prop to support both local and handler-based navigation
 */

import { Button } from "@/components/ui/button";
import { useValuationResultNavigation } from "../../hooks/useValuationResultNavigation";

interface DirectNavigationButtonProps {
  valuationData: any;
  buttonText: string;
  isDisabled?: boolean;
  onContinue?: () => void; // Optional callback for parent-controlled navigation
}

export const DirectNavigationButton = ({
  valuationData,
  buttonText,
  isDisabled = false,
  onContinue
}: DirectNavigationButtonProps) => {
  const { handleNavigation } = useValuationResultNavigation();

  const handleClick = () => {
    // If parent provided onContinue handler, call it first
    if (onContinue) {
      onContinue();
    }
    
    // Then handle the navigation
    handleNavigation(valuationData);
  };

  return (
    <Button
      variant="default"
      className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full sm:w-auto"
      onClick={handleClick}
      disabled={isDisabled}
    >
      {buttonText}
    </Button>
  );
};
