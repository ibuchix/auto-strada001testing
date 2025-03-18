
/**
 * Changes made:
 * - 2024-06-12: Fixed import error by removing unused imports
 * - 2024-08-08: Added support for restoring current step from localStorage
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData, defaultCarFeatures } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { useLoadDraft } from "./useLoadDraft";
import { useFormAutoSave } from "./useFormAutoSave";

export const useCarListingForm = (userId?: string, draftId?: string) => {
  const [carId, setCarId] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialStep, setInitialStep] = useState<number>(0);
  
  const valuationData = {
    ...JSON.parse(localStorage.getItem('valuationData') || '{}'),
    mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
    transmission: localStorage.getItem('tempGearbox') || 'manual',
    vin: localStorage.getItem('tempVIN') || ''
  };

  // Try to restore the current step from localStorage
  useEffect(() => {
    const savedStep = localStorage.getItem('formCurrentStep');
    if (savedStep) {
      setInitialStep(parseInt(savedStep));
    }
  }, []);

  const form = useForm<CarListingFormData>({
    defaultValues: {
      ...getFormDefaults(),
      features: defaultCarFeatures,
      numberOfKeys: "1",
      seatMaterial: "cloth",
      transmission: valuationData.transmission as "manual" | "automatic" | null,
    },
  });

  useLoadDraft(form, setCarId, setLastSaved, userId, draftId);
  useFormAutoSave(form, setLastSaved, valuationData, userId, carId);

  return {
    form,
    carId,
    lastSaved,
    initialStep
  };
};
