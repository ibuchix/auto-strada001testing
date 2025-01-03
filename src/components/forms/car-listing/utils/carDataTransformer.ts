import { CarListingFormData } from "@/types/forms";
import { Database } from "@/integrations/supabase/types";

type CarInsert = Database['public']['Tables']['cars']['Insert'];

export const prepareCarData = (
  data: CarListingFormData,
  valuationData: any,
  userId: string
): CarInsert => {
  if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation || !valuationData.year) {
    throw new Error("Please complete the vehicle valuation first");
  }

  const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`.trim();
  if (!title) {
    throw new Error("Unable to generate listing title");
  }

  return {
    seller_id: userId,
    title,
    name: data.name,
    address: data.address,
    mobile_number: data.mobileNumber,
    is_damaged: data.isDamaged,
    is_registered_in_poland: data.isRegisteredInPoland,
    features: data.features,
    seat_material: data.seatMaterial,
    number_of_keys: parseInt(data.numberOfKeys),
    has_tool_pack: data.hasToolPack,
    has_documentation: data.hasDocumentation,
    is_selling_on_behalf: data.isSellingOnBehalf,
    has_private_plate: data.hasPrivatePlate,
    finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
    service_history_type: data.serviceHistoryType,
    seller_notes: data.sellerNotes,
    make: valuationData.make,
    model: valuationData.model,
    year: valuationData.year,
    vin: valuationData.vin,
    mileage: valuationData.mileage,
    price: valuationData.valuation,
    transmission: valuationData.transmission || null,
    valuation_data: valuationData,
    is_draft: true
  };
};