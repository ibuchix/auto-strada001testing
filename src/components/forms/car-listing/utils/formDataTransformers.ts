import { CarListingFormData, defaultCarFeatures } from "@/types/forms";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

type CarInsert = Database['public']['Tables']['cars']['Insert'];

export const transformFormToDbData = (formData: CarListingFormData, userId: string): CarInsert => {
  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const vin = localStorage.getItem('tempVIN') || '';

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
    transmission: formData.transmission
  };
};

export const transformDbToFormData = (dbData: any): Partial<CarListingFormData> => {
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
    transmission: dbData.transmission as "manual" | "automatic" | null
  };
};