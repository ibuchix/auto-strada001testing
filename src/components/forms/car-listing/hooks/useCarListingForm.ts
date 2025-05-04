
/**
 * Changes made:
 * - Added missing imports (toast, UseFormReturn)
 * - Added ValuationData type definition
 * - Added safeParseNumber function
 * - Fixed references to these items
 * - Maintained integration with useFormDefaults
 * - Integrated with carSchema validation
 * - 2028-11-14: Fixed TypeScript error by properly returning loadInitialData and handleReset
 * - 2025-05-31: Updated to work with the filtered valuation data structure
 * - 2025-07-27: Fixed getInitialFormValues import
 * - 2025-05-06: Fixed transmission type compatibility issue
 * - 2025-05-08: Fixed import for getFormDefaults/getInitialFormValues
 */

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarListingFormData } from "@/types/forms";
import { carSchema } from "@/utils/validation/carSchema";
import { getFormDefaults } from "./useFormHelpers";
import { toast } from "sonner";
import { toNumberValue } from "@/utils/typeConversion";

// ValuationData type definition for data received from API or localStorage
type ValuationData = {
  vin?: string;
  make?: string;
  model?: string;
  year?: number | string;
  mileage?: number | string;
  transmission?: "manual" | "automatic" | "semi-automatic";
  reserve_price?: number;
  [key: string]: any; // Allow additional properties
};

// Helper for safe number parsing
const safeParseNumber = (value: unknown, fallback: number): number => {
  return toNumberValue(value as string | number | null | undefined, fallback);
};

// Extended form return type with our custom methods
interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData: () => void;
  handleReset: () => void;
}

export const useCarListingForm = (userId: string, draftId?: string): ExtendedFormReturn => {
  const form = useForm<CarListingFormData>({
    defaultValues: getFormDefaults(),
    resolver: zodResolver(carSchema.partial()),
    mode: 'onBlur'
  });

  // Improved error handling for initial data loading
  const loadInitialData = () => {
    try {
      const valuationData = getValidatedValuationData();
      const tempMileage = getValidatedMileage();
      
      if (valuationData) {
        applyValuationData(form, valuationData);
      } else {
        toast.warning("No existing valuation data found", {
          description: "Start a new valuation or continue with manual entry"
        });
      }

      if (tempMileage) {
        form.setValue('mileage', tempMileage);
      }
    } catch (error) {
      console.error('Data loading failed:', error);
      toast.error('Failed to load initial data', {
        description: 'Please refresh the page or start over',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    }
  };
  
  // Form reset handler
  const handleReset = () => {
    form.reset(getFormDefaults());
  };

  return { 
    ...form, 
    loadInitialData, 
    handleReset 
  };
};

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
    
    // Ensure transmission is a valid enum value
    let validTransmission: "manual" | "automatic" | "semi-automatic" = "manual";
    if (
      data.transmission === "automatic" || 
      data.transmission === "semi-automatic" || 
      data.transmission === "manual"
    ) {
      validTransmission = data.transmission;
    }
    
    return {
      ...data,
      year: safeParseNumber(data.year, new Date().getFullYear()),
      mileage: safeParseNumber(data.mileage, 0),
      reserve_price: safeParseNumber(data.reserve_price, 0),
      transmission: validTransmission
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
  // Essential fields to apply to the form
  const fields: (keyof CarListingFormData)[] = [
    'vin', 'make', 'model', 'year', 'mileage'
  ];

  fields.forEach(field => {
    if (data[field] !== undefined) {
      // Convert numeric string values to numbers
      if (field === 'year' || field === 'mileage') {
        form.setValue(field as any, Number(data[field]));
      } else {
        form.setValue(field as any, data[field] as any);
      }
    }
  });
  
  // Set transmission separately with type checking
  if (data.transmission) {
    form.setValue('transmission', data.transmission);
  }
  
  // Handle reserve price separately if needed for the form
  if (data.reserve_price && form.getValues('reserve_price') === undefined) {
    try {
      form.setValue('reserve_price' as any, Number(data.reserve_price));
    } catch (error) {
      console.warn('Could not set reserve_price on form', error);
    }
  }
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
