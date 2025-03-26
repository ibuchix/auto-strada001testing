
/**
 * Changes made:
 * - 2024-08-04: Fixed import for defaultCarFeatures and added damageReports to default values
 */

import { useState, useEffect } from "react";
import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

export const useFormDefaults = (userId?: string) => {
  const [defaultValues, setDefaultValues] = useState<Partial<CarListingFormData>>({
    name: "",
    address: "",
    mobileNumber: "",
    contactEmail: "",
    previousOwners: 1,
    accidentHistory: "none",
    isDamaged: false,
    isRegisteredInPoland: true,
    isSellingOnBehalf: false,
    hasPrivatePlate: false,
    financeAmount: "",
    serviceHistoryType: "full",
    sellerNotes: "",
    seatMaterial: "cloth",
    numberOfKeys: "1",
    conditionRating: 3,
    features: defaultCarFeatures,
    uploadedPhotos: [],
    additionalPhotos: [],
    requiredPhotos: {
      front: null,
      rear: null,
      interior: null,
      engine: null
    },
    rimPhotos: {
      front_left: null,
      front_right: null,
      rear_left: null,
      rear_right: null
    },
    warningLightPhotos: [],
    rimPhotosComplete: false,
    financeDocument: null,
    serviceHistoryFiles: [],
    damageReports: []
  });

  useEffect(() => {
    if (userId) {
      setDefaultValues(prev => ({
        ...prev,
        userId
      }));
    }
  }, [userId]);

  return defaultValues;
};
