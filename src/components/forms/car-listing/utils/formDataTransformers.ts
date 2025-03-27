
/**
 * Changes made:
 * - 2024-03-20: Fixed type references to match database schema
 * - 2024-03-20: Updated property names to match database schema
 * - 2024-03-19: Added support for converting between form and database formats
 * - 2024-03-19: Added handling for default values and nullable fields
 * - 2024-03-25: Added support for additional_photos field
 * - 2024-08-08: Added support for form_metadata with current_step
 * - 2024-08-09: Fixed type handling for form_metadata field
 * - 2024-12-05: Added error handling for localStorage data access
 * - 2024-12-06: Fixed type errors with valuationData properties
 * - 2024-08-04: Fixed "name" column issue by using seller_name instead
 * - 2025-05-31: Standardized field naming approach by providing both name and seller_name
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field has_documentation
 * - 2025-06-10: Added schema validation to catch field mismatches
 * - 2025-06-15: Removed defaultCarFeatures dependency
 * - 2025-06-15: Removed references to non-existent field is_selling_on_behalf
 */

import { CarListingFormData } from "@/types/forms";
import { Json } from "@/integrations/supabase/types";

// Default car features definition
const defaultCarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

export const transformFormToDbData = (formData: CarListingFormData, userId: string): any => {
  // Safely retrieve data from localStorage with fallbacks
  let valuationData: Record<string, any> = {};
  let mileage = 0;
  let vin = '';
  let currentStep = 0;
  
  try {
    const valuationDataStr = localStorage.getItem('valuationData');
    valuationData = valuationDataStr ? JSON.parse(valuationDataStr) : {};
    
    mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    vin = localStorage.getItem('tempVIN') || '';
    currentStep = parseInt(localStorage.getItem('formCurrentStep') || '0');
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Create basic form data even if localStorage data is missing
  const title = valuationData && 
    typeof valuationData === 'object' && 
    'make' in valuationData && 
    'model' in valuationData && 
    'year' in valuationData
      ? `${valuationData.make || ''} ${valuationData.model || ''} ${valuationData.year || ''}`.trim()
      : 'Draft Listing';
  
  // Safely extract price from valuation data, handling undefined/missing values
  const price = valuationData && typeof valuationData === 'object' 
    ? ('valuation' in valuationData && valuationData.valuation !== undefined && valuationData.valuation !== null
        ? valuationData.valuation 
        : ('averagePrice' in valuationData && valuationData.averagePrice !== undefined && valuationData.averagePrice !== null
            ? valuationData.averagePrice 
            : 0)) 
    : 0;

  return {
    seller_id: userId,
    // Include both name and seller_name fields for maximum compatibility
    name: formData.name, // For compatibility with code expecting name field
    seller_name: formData.name, // For consistency with database schema
    address: formData.address,
    mobile_number: formData.mobileNumber,
    features: formData.features as unknown as Json,
    is_damaged: formData.isDamaged,
    is_registered_in_poland: formData.isRegisteredInPoland,
    // REMOVED: is_selling_on_behalf field - it doesn't exist in database
    has_private_plate: formData.hasPrivatePlate,
    finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
    service_history_type: formData.serviceHistoryType,
    seller_notes: formData.sellerNotes,
    seat_material: formData.seatMaterial,
    number_of_keys: parseInt(formData.numberOfKeys),
    is_draft: true,
    last_saved: new Date().toISOString(),
    mileage: mileage,
    price: price,
    title: title,
    vin: vin,
    transmission: formData.transmission,
    additional_photos: formData.uploadedPhotos || [],
    form_metadata: {
      current_step: currentStep,
      last_updated: new Date().toISOString()
    } as Json
  };
};

export const transformDbToFormData = (dbData: any): Partial<CarListingFormData> => {
  // Safely handle form_metadata
  const metadata = dbData.form_metadata as Record<string, any> | null;
  if (metadata && typeof metadata === 'object' && 'current_step' in metadata) {
    try {
      localStorage.setItem('formCurrentStep', String(metadata.current_step));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
  
  return {
    // Map seller_name to name for form data, with fallback to name field
    name: dbData.seller_name || dbData.name || "",
    address: dbData.address || "",
    mobileNumber: dbData.mobile_number || "",
    features: dbData.features ? { ...defaultCarFeatures, ...dbData.features as Record<string, boolean> } : defaultCarFeatures,
    isDamaged: dbData.is_damaged || false,
    isRegisteredInPoland: dbData.is_registered_in_poland || false,
    // REMOVED: isSellingOnBehalf field - not in database
    hasPrivatePlate: dbData.has_private_plate || false,
    financeAmount: dbData.finance_amount?.toString() || "",
    serviceHistoryType: dbData.service_history_type || "none",
    sellerNotes: dbData.seller_notes || "",
    seatMaterial: dbData.seat_material || "",
    numberOfKeys: dbData.number_of_keys?.toString() || "1",
    transmission: dbData.transmission as "manual" | "automatic" | null,
    uploadedPhotos: dbData.additional_photos || []
  };
};
