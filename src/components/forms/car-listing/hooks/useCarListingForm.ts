
/**
 * Changes made:
 * - 2024-08-20: Added proper valuation data handling
 * - 2024-09-10: Updated to use useFormPersistence hook
 * - 2025-07-02: Fixed type issues and removed form property
 * - 2025-07-31: Fixed missing getValuationData function
 * - 2025-08-02: Updated to match the UseFormPersistenceResult interface
 * - 2025-08-04: Fixed type casting for numeric values
 * - 2025-08-12: Implemented improved validation data loading with helper functions
 */
import { useForm, UseFormReturn } from "react-hook-form";
import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

type ValuationData = {
  vin?: string;
  make?: string;
  model?: string;
  year?: number | string;
  mileage?: number | string;
  transmission?: "manual" | "automatic";
};

// Helper for safe number parsing
const safeParseNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
};

export const useCarListingForm = (userId: string, draftId?: string) => {
  const form = useForm<CarListingFormData>({
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      vin: '',
      features: defaultCarFeatures,
      transmission: "manual",
      isRegisteredInPoland: true,
      serviceHistoryType: "none",
      numberOfKeys: "2",
      // Add other required fields from CarListingFormData
      ...defaultCarFormValues,
      uploadedPhotos: [] // Required for form validation
    },
    mode: 'onBlur'
  });

  // Unified data loader
  const loadInitialData = () => {
    try {
      const valuationData = getValidatedValuationData();
      const tempMileage = getValidatedMileage();
      
      if (valuationData) applyValuationData(form, valuationData);
      if (tempMileage) form.setValue('mileage', tempMileage);
    } catch (error) {
      console.error('Data loading failed:', error);
    }
  };

  return { ...form, loadInitialData };
};

// Helper functions
const defaultCarFormValues = {
  name: "",
  address: "",
  mobileNumber: "",
  isDamaged: false,
  isSellingOnBehalf: false,
  hasPrivatePlate: false,
  sellerNotes: "",
  damageReports: [] // Add required array fields
};

const getValidatedValuationData = (): ValuationData | null => {
  try {
    const data = JSON.parse(localStorage.getItem('valuationData') || 'null');
    if (!data?.vin || !data.make || !data.model) return null;
    
    return {
      ...data,
      year: safeParseNumber(data.year, new Date().getFullYear()),
      mileage: safeParseNumber(data.mileage, 0)
    };
  } catch (error) {
    console.error('Valuation data error:', error);
    return null;
  }
};

const getValidatedMileage = (): number | null => {
  const tempMileage = localStorage.getItem('tempMileage');
  const parsed = safeParseNumber(tempMileage, NaN);
  return parsed >= 0 ? parsed : null;
};

const applyValuationData = (
  form: UseFormReturn<CarListingFormData>, 
  data: ValuationData
) => {
  const fields: (keyof CarListingFormData)[] = [
    'vin', 'make', 'model', 'year', 'mileage', 'transmission'
  ];

  fields.forEach(field => {
    if (data[field] !== undefined) {
      form.setValue(field as any, data[field] as any);
    }
  });
};

// Export a function to get valuation data from localStorage - kept for backward compatibility
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
