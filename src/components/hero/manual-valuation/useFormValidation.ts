import { useState } from 'react';
import { ManualValuationData } from '../ManualValuationForm';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Partial<Record<keyof ManualValuationData, string>>>({});

  const validateForm = (data: ManualValuationData) => {
    const newErrors: Partial<Record<keyof ManualValuationData, string>> = {};
    const currentYear = new Date().getFullYear();

    if (!data.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!data.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!data.year) {
      newErrors.year = 'Year is required';
    } else {
      const yearNum = parseInt(data.year);
      if (yearNum < 1900 || yearNum > currentYear + 1) {
        newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
      }
    }

    if (!data.mileage) {
      newErrors.mileage = 'Mileage is required';
    } else if (parseInt(data.mileage) < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
    }

    if (!data.transmission) {
      newErrors.transmission = 'Transmission type is required';
    }

    if (!data.fuel) {
      newErrors.fuel = 'Fuel type is required';
    }

    if (!data.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateForm, setErrors };
};