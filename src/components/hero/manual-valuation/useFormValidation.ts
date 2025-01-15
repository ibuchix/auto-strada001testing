import { useState } from 'react';
import { ManualValuationData } from '../ManualValuationForm';
import { Database } from "@/integrations/supabase/types";

type FuelType = Database['public']['Enums']['car_fuel_type'];
type CountryCode = Database['public']['Enums']['car_country_code'];
type TransmissionType = Database['public']['Enums']['car_transmission_type'];

const isValidFuelType = (value: string): value is FuelType => {
  return ['petrol', 'diesel', 'electric', 'hybrid'].includes(value);
};

const isValidCountryCode = (value: string): value is CountryCode => {
  return ['PL', 'DE', 'UK'].includes(value);
};

const isValidTransmissionType = (value: string): value is TransmissionType => {
  return ['manual', 'automatic'].includes(value);
};

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Partial<Record<keyof ManualValuationData, string>>>({});

  const validateForm = (data: ManualValuationData) => {
    const newErrors: Partial<Record<keyof ManualValuationData, string>> = {};
    const currentYear = new Date().getFullYear();

    // Validate make
    if (!data.make?.trim()) {
      newErrors.make = 'Make is required';
    }

    // Validate model
    if (!data.model?.trim()) {
      newErrors.model = 'Model is required';
    }

    // Validate year
    if (!data.year) {
      newErrors.year = 'Year is required';
    } else {
      const yearNum = parseInt(data.year);
      if (yearNum < 1900 || yearNum > currentYear + 1) {
        newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
      }
    }

    // Validate mileage
    if (!data.mileage) {
      newErrors.mileage = 'Mileage is required';
    } else if (parseInt(data.mileage) < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
    }

    // Validate transmission
    if (!data.transmission || !isValidTransmissionType(data.transmission)) {
      newErrors.transmission = 'Please select a valid transmission type';
    }

    // Validate fuel type
    if (!data.fuel || !isValidFuelType(data.fuel)) {
      newErrors.fuel = 'Please select a valid fuel type';
    }

    // Validate country
    if (!data.country || !isValidCountryCode(data.country)) {
      newErrors.country = 'Please select a valid country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateForm, setErrors };
};