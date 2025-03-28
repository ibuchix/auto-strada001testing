import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarListingFormData } from "@/types/forms";
import { carListingValidationSchema } from "@/validation/carListing";
import { getInitialFormValues } from "./useFormDefaults";

export const useCarListingForm = (userId: string, draftId?: string) => {
  const form = useForm<CarListingFormData>({
    defaultValues: getInitialFormValues(),
    resolver: zodResolver(carListingValidationSchema),
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

  return { ...form, loadInitialData };
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
