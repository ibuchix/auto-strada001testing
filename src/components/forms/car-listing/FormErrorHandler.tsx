
/**
 * Changes made:
 * - 2024-09-05: Extracted from CarListingForm.tsx to separate component
 */

import { ErrorHandler } from "./submission/ErrorHandler";

interface FormErrorHandlerProps {
  error?: string;
}

export const FormErrorHandler = ({ error = "Please sign in to create a listing. Your progress will be saved." }: FormErrorHandlerProps) => {
  return (
    <ErrorHandler error={error} />
  );
};
