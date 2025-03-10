
/**
 * Changes made:
 * - 2024-06-12: Fixed import error by removing unused imports
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData, defaultCarFeatures } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { useLoadDraft } from "./useLoadDraft";
import { useFormAutoSave } from "./useFormAutoSave";

export const useCarListingForm = (userId?: string, draftId?: string) => {
  const [carId, setCarId] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const valuationData = {
    ...JSON.parse(localStorage.getItem('valuationData') || '{}'),
    mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
    transmission: localStorage.getItem('tempGearbox') || 'manual',
    vin: localStorage.getItem('tempVIN') || ''
  };

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
    lastSaved
  };
};
