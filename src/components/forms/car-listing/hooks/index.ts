
/**
 * Changes made:
 * - 2028-03-27: Created index file to export all step navigation hooks
 * - 2028-11-12: Added exports for new hooks created during FormContent refactoring
 * - 2028-11-14: Exported extended form types for TypeScript compatibility
 */

export { useStepNavigation, STEP_FIELD_MAPPINGS } from './useStepNavigation';
export { useStepState } from './useStepState';
export { useStepValidation } from './useStepValidation';
export { useStepProgress } from './useStepProgress';
export { useFormInitialization } from './useFormInitialization';
export { useFormProgress } from './useFormProgress';
export { useValidationErrorTracking } from './useValidationErrorTracking';
export { useFilteredSteps } from './useFilteredSteps';
export { useFormDialogs } from './useFormDialogs';

// Export extended form type interface
export type { ExtendedFormReturn } from './types';
