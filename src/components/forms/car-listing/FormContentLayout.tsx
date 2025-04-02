
/**
 * Changes made:
 * - 2024-06-10: Extracted form layout logic from FormContent.tsx
 * - Created a dedicated layout component to manage form structure
 * - 2028-05-15: Added nested error boundaries and detailed error handling
 * - 2028-05-15: Added debugging logs for component lifecycle
 * - 2028-05-15: Enhanced loading states with better UI feedback
 */

import { ReactNode, useEffect } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { FormDataProvider } from "./context/FormDataContext";
import { CarListingFormData } from "@/types/forms";
import { FormErrorHandler } from "./FormErrorHandler";
import { LoadingState } from "./LoadingState";

interface FormContentLayoutProps {
  form: UseFormReturn<CarListingFormData>;
  isInitializing: boolean;
  isLoadingDraft: boolean;
  draftError: Error | null;
  onDraftErrorRetry: () => void;
  onFormSubmit: (data: CarListingFormData) => Promise<void>;
  onFormError: (error: Error) => void;
  children: ReactNode;
  layoutId?: string; // For identifying this instance in logs
}

export const FormContentLayout = ({
  form,
  isInitializing,
  isLoadingDraft,
  draftError,
  onDraftErrorRetry,
  onFormSubmit,
  onFormError,
  children,
  layoutId = 'main'
}: FormContentLayoutProps) => {
  // Add lifecycle logging
  useEffect(() => {
    console.log(`[FormContentLayout:${layoutId}] Mounted`);
    return () => console.log(`[FormContentLayout:${layoutId}] Unmounted`);
  }, [layoutId]);
  
  // Log state changes
  useEffect(() => {
    console.log(`[FormContentLayout:${layoutId}] State update:`, { 
      isInitializing, 
      isLoadingDraft, 
      hasDraftError: !!draftError 
    });
  }, [isInitializing, isLoadingDraft, draftError, layoutId]);

  if (draftError && !isInitializing) {
    console.log(`[FormContentLayout:${layoutId}] Rendering error state:`, draftError);
    return <FormErrorHandler draftError={draftError} onRetry={onDraftErrorRetry} />;
  }

  if (isInitializing || isLoadingDraft) {
    console.log(`[FormContentLayout:${layoutId}] Rendering loading state`);
    return <LoadingState message={isInitializing ? "Initializing form..." : "Loading draft data..."} />;
  }

  // Nested error boundaries to provide more granular error recovery
  return (
    <ErrorBoundary 
      onError={(error) => {
        console.error(`[FormContentLayout:${layoutId}] Top-level error:`, error);
        onFormError(error);
      }}
      boundary={`form-layout-${layoutId}`}
    >
      <FormProvider {...form}>
        <FormDataProvider form={form}>
          <form 
            onSubmit={form.handleSubmit(onFormSubmit)} 
            className="space-y-8"
            id={`car-listing-form-${layoutId}`}
          >
            <ErrorBoundary 
              boundary={`form-content-${layoutId}`}
              resetOnPropsChange
            >
              {children}
            </ErrorBoundary>
          </form>
        </FormDataProvider>
      </FormProvider>
    </ErrorBoundary>
  );
};
