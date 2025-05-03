import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { CarListingFormData, carListingFormSchema } from "@/types/forms";
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useFormState } from '../context/FormStateContext';
import { DEFAULT_VALUES as defaultCarFeatures } from '../constants/defaultValues';
import { transformDbToFormData } from '../utils/formDataTransformers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseFormControllerProps {
  defaultValues?: CarListingFormData;
  isDraft?: boolean;
  draftId?: string;
  fromValuation?: boolean;
}

export const useFormController = ({ defaultValues, isDraft, draftId, fromValuation }: UseFormControllerProps = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateFormState } = useFormState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isFormTouched, setIsFormTouched] = useState(false);
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [isDeleteEnabled, setIsDeleteEnabled] = useState(false);
  const [isPublishEnabled, setIsPublishEnabled] = useState(false);
  const [isCancelEnabled, setIsCancelEnabled] = useState(false);
  const [isResetEnabled, setIsResetEnabled] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [steps, setSteps] = useState([
    { id: 'valuation', label: 'Valuation', description: 'Verify car details' },
    { id: 'details', label: 'Details', description: 'Add car specifications' },
    { id: 'photos', label: 'Photos', description: 'Upload car images' },
    { id: 'pricing', label: 'Pricing', description: 'Set your price' },
    { id: 'review', label: 'Review', description: 'Confirm your listing' }
  ]);

  // Initialize form with react-hook-form
  const form = useForm<CarListingFormData>({
    resolver: zodResolver(carListingFormSchema),
    defaultValues: useMemo(() => ({
      make: '',
      model: '',
      year: 2010,
      mileage: 100000,
      vin: '',
      price: 10000,
      reserve_price: 8000,
      transmission: 'manual',
      name: '',
      address: '',
      mobileNumber: '',
      isDamaged: false,
      isRegisteredInPoland: true,
      hasPrivatePlate: false,
      features: defaultCarFeatures,
      serviceHistoryType: 'full',
      sellerNotes: '',
      seatMaterial: 'leather',
      numberOfKeys: 2,
      financeAmount: null,
      is_draft: false,
      status: 'pending',
      requiredPhotos: {},
      damagePhotos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      form_metadata: {
        lastUpdatedStep: 0,
        completedSteps: [],
        visitedSteps: []
      },
      ...defaultValues
    }), [defaultValues]),
    mode: "onChange"
  });

  // Watch all form values
  const data = form.watch();

  // Normalize the form data
  const normalizedData = {
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    mileage: data.mileage,
    vin: data.vin,
  };

  // Update form state when form values change
  useEffect(() => {
    setIsDirty(form.isDirty());
    setIsFormValid(form.formState.isValid);
    setIsFormTouched(form.formState.isTouched);
    setIsSubmitted(form.formState.isSubmitted);
    setValidationError(form.formState.errors ? "Please correct the errors below" : null);
  }, [form.formState]);

  // Load draft data from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    if (isDraft && draftId) {
      loadDraftData(draftId);
    }
  }, [isDraft, draftId]);

  // Load draft data from local storage
  const loadDraftData = async (draftId: string) => {
    try {
      const { data: draftData, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) {
        console.error("Error loading draft:", error);
        toast({
          variant: "destructive",
          title: "Draft Load Error",
          description: "Failed to load draft data. Please try again."
        });
        return;
      }

      if (draftData) {
        const formData = transformDbToFormData(draftData);
        form.reset(formData);
        toast({
          title: "Draft Loaded",
          description: "Your saved draft has been loaded."
        });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast({
        variant: "destructive",
        title: "Draft Load Error",
        description: "Failed to load draft data. Please try again."
      });
    }
  };

  // Save form state to local storage
  const saveFormState = async (): Promise<boolean> => {
    try {
      const formData = form.getValues();
      const { error } = await supabase
        .from('cars')
        .upsert({
          ...formData,
          form_metadata: {
            lastUpdatedStep: currentStepIndex,
            completedSteps: steps.slice(0, currentStepIndex).map(step => step.id),
            visitedSteps: steps.slice(0, currentStepIndex + 1).map(step => step.id)
          }
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error("Error saving form state:", error);
        toast({
          variant: "destructive",
          title: "Save Error",
          description: "Failed to save form state. Please try again."
        });
        return false;
      }

      setLastSaved(new Date().toISOString());
      toast({
        title: "Form Saved",
        description: "Your progress has been saved."
      });
      return true;
    } catch (error) {
      console.error("Error saving form state:", error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save form state. Please try again."
      });
      return false;
    }
  };

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    try {
      // Trigger validation for all fields in the current step
      await form.trigger();

      // Check if there are any errors in the form state
      if (Object.keys(form.formState.errors).length > 0) {
        console.log("Validation errors:", form.formState.errors);
        return false;
      }

      // If there are no errors, return true
      return true;
    } catch (error) {
      console.error("Error validating form:", error);
      return false;
    }
  };

  return {
    form,
    data,
    steps,
    currentStepIndex,
    setCurrentStepIndex,
    isSubmitting,
    submissionError,
    isMounted,
    isFormTouched,
    isSaveEnabled,
    isDeleteEnabled,
    isPublishEnabled,
    isCancelEnabled,
    isResetEnabled,
    isFormComplete,
    isFormValid,
    isDirty,
    isSubmitted,
    lastSaved,
    lastSubmitted,
    validationError,
    setValidationError,
    validateCurrentStep,
    saveFormState,
    loadDraftData
  };
};
