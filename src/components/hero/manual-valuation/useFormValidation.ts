import { useState } from 'react';
import { ManualValuationData } from '../ManualValuationForm';
import { Database } from "@/integrations/supabase/types";

type FuelType = Database['public']['Enums']['car_fuel_type'];
type CountryCode = Database['public']['Enums']['car_country_code'];
type TransmissionType = Database['public']['Enums']['car_transmission_type'];

const VALID_FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid'];
const VALID_COUNTRY_CODES: CountryCode[] = ['PL', 'DE', 'UK'];
const VALID_TRANSMISSION_TYPES: TransmissionType[] = ['manual', 'automatic'];

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Partial<Record<keyof ManualValuationData, string>>>({});

  const validateForm = (data: ManualValuationData) => {
    console.log('Validating form data:', data);
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
    if (!data.transmission || !VALID_TRANSMISSION_TYPES.includes(data.transmission)) {
      console.log('Transmission validation failed:', {
        value: data.transmission,
        validOptions: VALID_TRANSMISSION_TYPES
      });
      newErrors.transmission = 'Please select a valid transmission type';
    }

    // Validate fuel type
    if (!data.fuel || !VALID_FUEL_TYPES.includes(data.fuel as FuelType)) {
      console.log('Fuel type validation failed:', {
        value: data.fuel,
        validOptions: VALID_FUEL_TYPES
      });
      newErrors.fuel = 'Please select a valid fuel type';
    }

    // Validate country
    if (!data.country || !VALID_COUNTRY_CODES.includes(data.country as CountryCode)) {
      console.log('Country code validation failed:', {
        value: data.country,
        validOptions: VALID_COUNTRY_CODES
      });
      newErrors.country = 'Please select a valid country';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateForm, setErrors };
};