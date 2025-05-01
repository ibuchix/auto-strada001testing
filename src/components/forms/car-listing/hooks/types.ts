
/**
 * Changes made:
 * - 2025-06-02: Updated FormContentProps to include fromValuation prop
 * - 2025-06-02: Added ExtendedFormReturn type for form hooks
 */
import { Session } from "@supabase/supabase-js";
import { UseFormReturn } from "react-hook-form";

export interface FormContentProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}

export interface ExtendedFormReturn<T = any> extends UseFormReturn<T> {
  loadInitialData?: () => void;
  handleReset?: () => void;
  [key: string]: any; // To allow spreading the remaining form properties
}

export interface UseFormControllerProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}
