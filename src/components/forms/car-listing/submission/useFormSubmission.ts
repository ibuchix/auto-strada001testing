
/**
 * Form submission hook
 * Updated: 2025-05-04 - Fixed TypeScript errors with import conflicts
 * Updated: 2025-05-26 - Updated to use car-listing specific FormStateContext
 * Updated: 2025-05-19 - Fixed throttling issues by cleaning up implementation
 */

// Import the hook directly from the root hooks folder
import { useFormSubmission as useFormSubmissionHook } from '@/hooks/useFormSubmission';
export { useFormSubmissionHook };

// Export an adapter function if needed
export function useFormSubmissionAdapter(formId: string) {
  return useFormSubmissionHook(formId);
}
