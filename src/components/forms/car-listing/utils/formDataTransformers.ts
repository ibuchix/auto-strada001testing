
/**
 * Changes made:
 * - 2024-03-20: Fixed type references to match database schema
 * - 2024-03-20: Updated property names to match database fields
 * - 2024-03-19: Added support for converting between form and database formats
 * - 2024-03-19: Added handling for default values and nullable fields
 * - 2024-03-25: Updated to include additional_photos field
 * - 2024-08-08: Added support for form_metadata with current_step
 * - 2024-08-09: Fixed type handling for form_metadata field
 */

import { CarListingFormData, defaultCarFeatures } from "@/types/forms";
import { Json } from "@/integrations/supabase/types";

export const transformFormToDbData = (formData: CarListingFormData, userId: string): any => {
  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const vin = localStorage.getItem('tempVIN') || '';
  const currentStep = parseInt(localStorage.getItem('formCurrentStep') || '0');

  return {
    seller_id: userId,
    name: formData.name,
    address: formData.address,
    mobile_number: formData.mobileNumber,
    features: formData.features as unknown as Json,
    is_damaged: formData.isDamaged,
    is_registered_in_poland: formData.isRegisteredInPoland,
    has_tool_pack: formData.hasToolPack,
    has_documentation: formData.hasDocumentation,
    is_selling_on_behalf: formData.isSellingOnBehalf,
    has_private_plate: formData.hasPrivatePlate,
    finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
    service_history_type: formData.serviceHistoryType,
    seller_notes: formData.sellerNotes,
    seat_material: formData.seatMaterial,
    number_of_keys: parseInt(formData.numberOfKeys),
    is_draft: true,
    last_saved: new Date().toISOString(),
    mileage: mileage,
    price: valuationData.valuation || valuationData.averagePrice || 0,
    title: `${valuationData.make || ''} ${valuationData.model || ''} ${valuationData.year || ''}`.trim() || 'Draft Listing',
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
    localStorage.setItem('formCurrentStep', String(metadata.current_step));
  }
  
  return {
    name: dbData.name || "",
    address: dbData.address || "",
    mobileNumber: dbData.mobile_number || "",
    features: dbData.features ? { ...defaultCarFeatures, ...dbData.features as Record<string, boolean> } : defaultCarFeatures,
    isDamaged: dbData.is_damaged || false,
    isRegisteredInPoland: dbData.is_registered_in_poland || false,
    hasToolPack: dbData.has_tool_pack || false,
    hasDocumentation: dbData.has_documentation || false,
    isSellingOnBehalf: dbData.is_selling_on_behalf || false,
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
