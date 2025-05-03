/**
 * Updated: 2025-07-27 - Fixed form defaults import
 */

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { getFormDefaults } from './useFormHelpers';

export function useFormInitialization(form: UseFormReturn<CarListingFormData>, carData?: CarListingFormData) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (isInitialized) return;
    
    try {
      // Get default values
      const defaultValues = getFormDefaults();
      
      if (carData && Object.keys(carData).length > 0) {
        // If we have car data, use it
        form.reset({
          ...defaultValues,
          ...carData
        });
      } else {
        // Otherwise, try to get data from localStorage (for valuation flow)
        const valuationData = getValuationDataFromStorage();
        
        if (valuationData) {
          form.reset({
            ...defaultValues,
            ...valuationData,
            fromValuation: true
          });
        } else {
          // Just use defaults
          form.reset(defaultValues);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing form:', error);
      
      // Reset to defaults if there's an error
      form.reset(getFormDefaults());
      setIsInitialized(true);
    }
  }, [form, carData, isInitialized]);
  
  return { isInitialized };
}

function getValuationDataFromStorage(): Partial<CarListingFormData> | null {
  try {
    const valuationDataString = localStorage.getItem('valuationData');
    if (!valuationDataString) return null;
    
    const valuationData = JSON.parse(valuationDataString);
    if (!valuationData || !valuationData.make || !valuationData.model) return null;
    
    return {
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      mileage: valuationData.mileage,
      vin: valuationData.vin,
      transmission: valuationData.transmission,
      price: valuationData.price || valuationData.valuation,
      reserve_price: valuationData.reservePrice,
      valuation_data: valuationData
    };
  } catch (error) {
    console.error('Error parsing valuation data:', error);
    return null;
  }
}
