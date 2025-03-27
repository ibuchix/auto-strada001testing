
/**
 * Changes made:
 * - 2024-08-20: Added proper valuation data handling
 * - 2024-09-10: Updated to use useFormPersistence hook
 * - 2025-07-02: Fixed type issues and removed form property
 * - 2025-07-31: Fixed missing getValuationData function
 * - 2025-08-02: Updated to match the UseFormPersistenceResult interface
 */
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Export a function to get valuation data from localStorage
export const getValuationData = () => {
  try {
    const valuationDataString = localStorage.getItem('valuationData');
    if (!valuationDataString) return null;
    return JSON.parse(valuationDataString);
  } catch (error) {
    console.error('Error parsing valuation data:', error);
    return null;
  }
};

// Function to validate valuation data
export const validateValuationData = () => {
  const data = getValuationData();
  if (!data) return null;
  
  // Basic validation to ensure we have the expected fields
  if (!data.vin || !data.make || !data.model) {
    console.warn('Incomplete valuation data found');
    return null;
  }
  
  return data;
};

export const useCarListingForm = (userId: string, draftId?: string) => {
  // Initialize form with default values
  const form = useForm<CarListingFormData>({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      features: {
        satNav: false,
        panoramicRoof: false,  
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false
      },
      isDamaged: false,
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "0",
      serviceHistoryType: "none",
      sellerNotes: "",
      numberOfKeys: "2",
      transmission: "manual",
    },
  });

  // Pre-fill form with valuation data if available
  const loadValuationData = () => {
    try {
      const valuationData = validateValuationData();
      if (!valuationData) return;

      // Update form with valuation data
      form.setValue('vin', valuationData.vin || '');
      form.setValue('make', valuationData.make || '');
      form.setValue('model', valuationData.model || '');
      form.setValue('year', valuationData.year || new Date().getFullYear());
      form.setValue('mileage', valuationData.mileage?.toString() || '');
      form.setValue('transmission', valuationData.transmission || 'manual');
      
      // Also try to load temporary mileage from localStorage if available
      const tempMileage = localStorage.getItem('tempMileage');
      if (tempMileage) {
        form.setValue('mileage', tempMileage);
      }
    } catch (error) {
      console.error('Error loading valuation data:', error);
    }
  };

  // Return the form and utility functions
  return {
    ...form,
    loadValuationData
  };
};
