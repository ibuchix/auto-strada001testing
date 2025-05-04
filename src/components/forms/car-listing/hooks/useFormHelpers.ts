
/**
 * Form Helper Functions
 * Created: 2025-05-06
 * Updated: 2025-05-08 - Fixed type conversion issues with numeric and enum values
 * Updated: 2025-05-09 - Fixed additional type conversion issues with mileage and year
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
    year: new Date().getFullYear(),
    mileage: 0,
    transmission: "manual" as const,
    fuel_type: "",
    price: 0,
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
        // Convert string values to appropriate types for the form
        const year = valuationData.year ? Number(valuationData.year) : defaultValues.year;
        const mileage = valuationData.mileage ? Number(valuationData.mileage) : defaultValues.mileage;
        const price = valuationData.price || valuationData.valuation ? 
                      Number(valuationData.price || valuationData.valuation) : 
                      defaultValues.price;
        
        // Ensure transmission is one of the allowed enum values
        let transmission: "manual" | "automatic" | "semi-automatic" = defaultValues.transmission;
        if (valuationData.transmission === "automatic" || 
            valuationData.transmission === "semi-automatic" || 
            valuationData.transmission === "manual") {
          transmission = valuationData.transmission;
        }
                      
        return {
          ...defaultValues,
          make: valuationData.make || defaultValues.make,
          model: valuationData.model || defaultValues.model,
          year: year,
          mileage: mileage,
          transmission: transmission,
          vin: valuationData.vin || "",
          price: price
        };
      }
    }
  } catch (error) {
    console.error("Error loading valuation data for form defaults:", error);
  }
  
  return defaultValues;
}

// Alias for getFormDefaults for backward compatibility
export const getInitialFormValues = getFormDefaults;
