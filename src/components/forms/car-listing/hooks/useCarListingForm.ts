import { useState } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { useLoadDraft } from "./useLoadDraft";
import { useFormAutoSave } from "./useFormAutoSave";
import { useFormSubmission } from "./useFormSubmission";

export const useCarListingForm = (userId?: string, draftId?: string) => {
  const [carId, setCarId] = useState<string>(draftId || '');
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
      numberOfKeys: "1",
      seatMaterial: "cloth",
      transmission: valuationData.transmission || null,
    },
  });

  useLoadDraft(form, setCarId, setLastSaved, userId, draftId);
  useFormAutoSave(form, setLastSaved, valuationData, userId, carId);
  const formSubmission = useFormSubmission(userId);

  return {
    form,
    carId,
    lastSaved,
    ...formSubmission
  };
};