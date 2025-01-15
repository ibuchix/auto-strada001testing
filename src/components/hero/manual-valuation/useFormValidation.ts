import { useState } from "react";
import { ManualValuationData } from "../ManualValuationForm";

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Partial<Record<keyof ManualValuationData, string>>>({});

  const validateForm = (data: ManualValuationData) => {
    const newErrors: Partial<Record<keyof ManualValuationData, string>> = {};
    const currentYear = new Date().getFullYear();

    if (!data.make?.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!data.model?.trim()) {
      newErrors.model = 'Model is required';
    }

    const year = parseInt(data.year);
    if (!year || year < 1900 || year > currentYear + 1) {
      newErrors.year = 'Please enter a valid year';
    }

    const mileage = parseInt(data.mileage);
    if (!mileage || mileage < 0) {
      newErrors.mileage = 'Please enter a valid mileage';
    }

    if (!['manual', 'automatic'].includes(data.transmission?.toLowerCase())) {
      newErrors.transmission = 'Please select a transmission type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateForm, setErrors };
};