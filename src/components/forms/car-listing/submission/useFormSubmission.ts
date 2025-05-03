
/**
 * Form submission hook
 * Updated: 2025-05-04 - Fixed TypeScript errors with import conflicts
 */

// File is being imported but also defined here, so import renamed
import { useFormSubmission as useFormSubmissionHook } from '@/hooks/useFormSubmission';
export { useFormSubmissionHook };

// Export an adapter function if needed
export function useFormSubmissionAdapter(formId: string) {
  return useFormSubmissionHook(formId);
}
