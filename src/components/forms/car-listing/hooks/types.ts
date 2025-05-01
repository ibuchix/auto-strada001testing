
/**
 * Types for car listing form hooks
 * 
 * Changes:
 * - 2025-05-31: Added fromValuation prop to FormContentProps
 * - 2025-06-01: Updated documentation for FormContentProps with fromValuation
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Session } from "@supabase/supabase-js";

// Extended form return type with our custom methods
export interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData?: () => void;
  handleReset?: () => void;
}

/**
 * Props for the FormContent component
 * @param session User session information
 * @param draftId Optional ID of an existing draft to load
 * @param onDraftError Optional error handler for draft loading errors
 * @param retryCount Optional counter for retry attempts
 * @param fromValuation Whether this form is being initialized from valuation data
 */
export interface FormContentProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}
