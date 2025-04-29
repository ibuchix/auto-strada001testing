
/**
 * ValuationLoadingState component for displaying loading indicators
 * Created: 2025-04-29
 */

import React from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";

interface ValuationLoadingStateProps {
  message: string;
}

export const ValuationLoadingState: React.FC<ValuationLoadingStateProps> = ({ 
  message 
}) => {
  return (
    <div className="p-6 text-center">
      <LoadingIndicator message={message} />
    </div>
  );
};
