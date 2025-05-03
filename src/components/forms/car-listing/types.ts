
/**
 * Type definitions for car listing form components
 * Created: 2025-07-02
 */

import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  fields?: string[];
  isOptional?: boolean;
}

export interface FormDataContextType {
  form: UseFormReturn<CarListingFormData>;
  data: CarListingFormData;
  steps: {
    id: string;
    label: string;
    description: string;
  }[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: number) => void;
  hasStepErrors: (step: number) => boolean;
  getStepErrors: (step: number) => Record<string, string>;
  getCurrentStepErrors: () => Record<string, string>;
  validateStep: (step: number) => Promise<boolean>;
  saveDraft: (data: CarListingFormData) => Promise<string | null>;
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
  formState: {
    isSubmitting: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  loadDraftData: (draftId: string) => Promise<CarListingFormData>;
}
