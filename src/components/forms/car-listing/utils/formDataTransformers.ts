import { CarListingFormData } from "@/types/forms";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";
import { transformFeaturesForDb } from "@/types/forms";

type CarInsert = Database['public']['Tables']['cars']['Insert'];

export const transformFormToDbData = (formData: CarListingFormData, userId: string): CarInsert => {
  if (!formData.features) {
    throw new Error("Features are required");
  }

  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const vin = localStorage.getItem('tempVIN') || '';

  return {
    seller_id: userId,
    name: formData.name,
    address: formData.address,
    mobile_number: formData.mobileNumber,
    features: transformFeaturesForDb(formData.features),
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
    transmission: formData.transmission || null
  };
};