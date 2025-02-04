import { useState } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { useLoadDraft } from "./useLoadDraft";
import { useFormAutoSave } from "./useFormAutoSave";
import { useFormSubmission } from "./useFormSubmission";

export const useCarListingForm = (userId?: string, draftId?: string) => {
  // Initialize carId as empty string unless we have a valid draftId
  const [carId, setCarId] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const valuationData = {
    ...JSON.parse(localStorage.getItem('valuationData') || '{}'),
    mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
    transmission: localStorage.getItem('tempGearbox') || 'manual',
    vin: localStorage.getItem('tempVIN') || ''
  };

  const defaultFeatures = {
    satNav: false,
    panoramicRoof: false,
    reverseCamera: false,
    heatedSeats: false,
    upgradedSound: false
  };

  const form = useForm<CarListingFormData>({
    defaultValues: {
      ...getFormDefaults(),
      features: defaultFeatures,
      numberOfKeys: "1",
      seatMaterial: "cloth",
      transmission: valuationData.transmission || null,
    },
  });

  // Only load draft if we have both userId and a valid draftId
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