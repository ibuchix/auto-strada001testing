
/**
 * Form submission hook
 * Updated: 2025-05-04 - Fixed TypeScript errors with import conflicts
 * Updated: 2025-05-26 - Updated to use car-listing specific FormStateContext
 * Updated: 2025-05-19 - Fixed throttling issues by cleaning up implementation
 * Updated: 2025-05-20 - Updated adapter to expose cooldown state
 * Updated: 2025-05-26 - Enhanced integration with centralized form submission hook
 */

// Import the hook directly from the root hooks folder
import { useFormSubmission as useFormSubmissionHook } from '@/hooks/useFormSubmission';

// Export both the original hook and adapted version
export { useFormSubmissionHook };

// Export an adapter function to provide specific form context
export function useFormSubmission(formId: string = 'car-listing') {
  const { 
    submissionState, 
    submitForm, 
    isSubmitting, 
    submitError, 
    resetSubmitError, 
    cooldownTimeRemaining 
  } = useFormSubmissionHook(formId);
  
  return {
    submissionState,
    submitForm,
    isSubmitting,
    submitError,
    resetSubmitError,
    cooldownTimeRemaining
  };
}
