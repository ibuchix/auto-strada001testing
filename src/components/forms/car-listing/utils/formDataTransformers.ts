import { CarListingFormData } from "@/types/forms";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";
import { transformFeaturesForDb, transformFeaturesFromDb } from "@/types/forms";

type CarInsert = Database['public']['Tables']['cars']['Insert'];

export const transformFormToDbData = (formData: CarListingFormData, userId: string): CarInsert => {
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
    price: 0,
    title: "Draft Listing",
    vin: formData.vin || '',
    mileage: formData.mileage || 0
  };
};

export const transformDbToFormData = (dbData: any): Partial<CarListingFormData> => {
  return {
    name: dbData.name,
    address: dbData.address,
    mobileNumber: dbData.mobile_number,
    features: transformFeaturesFromDb(dbData.features),
    isDamaged: dbData.is_damaged,
    isRegisteredInPoland: dbData.is_registered_in_poland,
    hasToolPack: dbData.has_tool_pack,
    hasDocumentation: dbData.has_documentation,
    isSellingOnBehalf: dbData.is_selling_on_behalf,
    hasPrivatePlate: dbData.has_private_plate,
    financeAmount: dbData.finance_amount?.toString(),
    serviceHistoryType: dbData.service_history_type,
    sellerNotes: dbData.seller_notes,
    seatMaterial: dbData.seat_material,
    numberOfKeys: dbData.number_of_keys?.toString(),
    vin: dbData.vin,
    mileage: dbData.mileage
  };
};