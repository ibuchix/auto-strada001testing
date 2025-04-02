
/**
 * Changes made:
 * - 2024-06-10: Extracted form layout logic from FormContent.tsx
 * - Created a dedicated layout component to manage form structure
 */

import { ReactNode } from "react";
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
}

export const FormContentLayout = ({
  form,
  isInitializing,
  isLoadingDraft,
  draftError,
  onDraftErrorRetry,
  onFormSubmit,
  onFormError,
  children
}: FormContentLayoutProps) => {
  if (draftError && !isInitializing) {
    return <FormErrorHandler draftError={draftError} onRetry={onDraftErrorRetry} />;
  }

  if (isInitializing || isLoadingDraft) {
    return <LoadingState />;
  }

  return (
    <ErrorBoundary onError={onFormError}>
      <FormProvider {...form}>
        <FormDataProvider form={form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
            {children}
          </form>
        </FormDataProvider>
      </FormProvider>
    </ErrorBoundary>
  );
};
