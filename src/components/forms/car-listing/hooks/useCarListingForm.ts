
/**
 * Updated to correctly type features and ensure type safety
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { useFormPersistence } from './useFormPersistence';
import { getValuationData } from '@/components/forms/car-listing/submission/utils/validationHandler';
import { checkForExistingDraft } from '../utils/formSaveUtils';
import { CarFeatures, defaultCarFeatures } from '@/utils/types/carFeatures';

export const useCarListingForm = (userId?: string, initialCarId?: string) => {
  const [carId, setCarId] = useState<string | undefined>(initialCarId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCheckedForExistingDraft, setHasCheckedForExistingDraft] = useState(false);

  // Initialize form with default empty values
  const form = useForm<Partial<CarListingFormData>>({
    defaultValues: {
      vin: '',
      make: '',
      model: '',
      year: undefined,
      notes: '',
      address: '',
      features: defaultCarFeatures as CarFeatures,
      isDamaged: false,
      damageReports: [],
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      warrantyRemaining: 0,
      mileage: 0,
      color: '',
      fuelType: '',
      transmission: ''
    },
    mode: 'onBlur'
  });

  // Setup form persistence
  const { loadForm, saveForm, resetForm } = useFormPersistence({
    form,
    carId,
    setCarId,
    onSaveStart: () => setIsSaving(true),
    onSaveEnd: (success) => {
      setIsSaving(false);
      if (success) {
        setLastSaved(new Date());
      }
    },
    userId
  });

  // Check for existing draft on initial load
  useEffect(() => {
    if (!userId || hasCheckedForExistingDraft || carId) return;

    const checkDraft = async () => {
      try {
        const draftId = await checkForExistingDraft(userId);
        if (draftId) {
          setCarId(draftId);
        }
        setHasCheckedForExistingDraft(true);
      } catch (error) {
        console.error('Error checking for draft:', error);
        setHasCheckedForExistingDraft(true);
      }
    };

    checkDraft();
  }, [userId, hasCheckedForExistingDraft, carId]);

  // Load form data from local storage or API
  useEffect(() => {
    if (carId) {
      loadForm(carId);
    } else {
      // Try to pre-populate from valuation data
      try {
        const valuationData = getValuationData();
        if (valuationData) {
          const { vin, make, model, year, mileage, fuel_type, transmission } = valuationData;
          
          // Create normalized form data with type safety for features
          form.reset({
            vin,
            make,
            model,
            year: year ? parseInt(year) : undefined,
            mileage: mileage ? parseInt(mileage) : 0,
            fuelType: fuel_type || '',
            transmission: transmission || '',
            features: defaultCarFeatures
          }, { keepValues: false });
        }
      } catch (error) {
        console.error('Error loading valuation data:', error);
      }
    }
  }, [carId, loadForm, form]);

  // Detect when form becomes dirty
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsFormDirty(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Helper functions for step navigation
  const goToNextStep = () => {
    setCurrentStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    window.scrollTo(0, 0);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  // Function to save form progress
  const saveProgress = () => {
    return saveForm();
  };

  // Cleanup form on unmount
  const cleanup = () => {
    form.reset({});
    resetForm();
    setCarId(undefined);
    setCurrentStep(0);
  };

  return {
    form,
    carId,
    setCarId,
    currentStep,
    isSubmitting,
    setIsSubmitting,
    submissionError,
    setSubmissionError,
    isFormDirty,
    lastSaved,
    isSaving,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    saveProgress,
    cleanup
  };
};
