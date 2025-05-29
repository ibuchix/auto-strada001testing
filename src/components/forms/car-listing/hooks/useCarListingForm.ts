
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
 * - 2025-05-24: Updated to use camelCase field names consistently
 * - 2025-05-29: REMOVED price field references - using only reservePrice
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
  reservePrice?: number;
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
      reservePrice: safeParseNumber(data.reservePrice, 0),
      transmission: validTransmission
    };
  } catch (error) {
    console.error("Error loading valuation data:", error);
    return null;
  }
};

// Get validated mileage from storage
const getValidatedMileage = (): number | null => {
  try {
    const mileageStr = localStorage.getItem('temp_mileage');
    if (!mileageStr) return null;
    
    const mileage = parseInt(mileageStr, 10);
    return isNaN(mileage) ? null : mileage;
  } catch (error) {
    console.error("Error loading mileage:", error);
    return null;
  }
};

// Helper to apply valuation data to form
const applyValuationData = (
  form: UseFormReturn<CarListingFormData>,
  valuationData: ValuationData
): void => {
  // Set basic vehicle information
  form.setValue('make', valuationData.make || '');
  form.setValue('model', valuationData.model || '');
  form.setValue('year', safeParseNumber(valuationData.year, new Date().getFullYear()));
  form.setValue('mileage', safeParseNumber(valuationData.mileage, 0));
  form.setValue('vin', valuationData.vin || '');
  
  // Set reserve price (single price field)
  if (valuationData.reservePrice) {
    form.setValue('reservePrice', safeParseNumber(valuationData.reservePrice, 0));
  }
  
  // Set transmission if valid
  if (
    valuationData.transmission === 'automatic' ||
    valuationData.transmission === 'manual' ||
    valuationData.transmission === 'semi-automatic'
  ) {
    form.setValue('transmission', valuationData.transmission);
  }
  
  // Store valuation data for future reference
  form.setValue('valuationData', valuationData);
  form.setValue('fromValuation', true);
  
  console.log('Valuation data applied to form:', valuationData);
};
