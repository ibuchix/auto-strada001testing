
/**
 * Types for car listing form hooks
 * 
 * Changes:
 * - 2025-05-31: Added fromValuation prop to ExtendedFormReturn type
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Extended form return type with our custom methods
export interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData?: () => void;
  handleReset?: () => void;
}

export interface FormContentProps {
  session: any;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}
