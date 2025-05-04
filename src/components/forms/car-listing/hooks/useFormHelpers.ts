
/**
 * Form Helper Functions
 * Created: 2025-05-06
 * Purpose: Provides utility functions for form initialization and data handling
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Get default form values, optionally incorporating valuation data
 */
export function getFormDefaults(): Partial<CarListingFormData> {
  const defaultValues: Partial<CarListingFormData> = {
    make: "",
    model: "",
    year: "",
    color: "",
    mileage: "",
    transmission: "",
    fuel_type: "",
    price: "",
    description: "",
    hasOutstandingFinance: false,
    isDamaged: false,
    finance_amount: ""
  };
  
  // Try to get valuation data from localStorage
  try {
    const valuationDataString = localStorage.getItem('valuationData');
    if (valuationDataString) {
      const valuationData = JSON.parse(valuationDataString);
      
      // Merge valuation data with defaults if available
      if (valuationData && typeof valuationData === 'object') {
        return {
          ...defaultValues,
          make: valuationData.make || defaultValues.make,
          model: valuationData.model || defaultValues.model,
          year: valuationData.year?.toString() || defaultValues.year,
          mileage: valuationData.mileage?.toString() || defaultValues.mileage,
          transmission: valuationData.transmission || defaultValues.transmission,
          vin: valuationData.vin || "",
          price: (valuationData.price || valuationData.valuation)?.toString() || defaultValues.price
        };
      }
    }
  } catch (error) {
    console.error("Error loading valuation data for form defaults:", error);
  }
  
  return defaultValues;
}
