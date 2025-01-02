import { CarListingFormData } from "@/types/forms";
import { Json } from "@/integrations/supabase/types";

export const prepareCarFeatures = (features: CarListingFormData['features']): Json => ({
  satNav: features?.satNav || false,
  panoramicRoof: features?.panoramicRoof || false,
  reverseCamera: features?.reverseCamera || false,
  heatedSeats: features?.heatedSeats || false,
  upgradedSound: features?.upgradedSound || false
});

export const prepareCarData = (data: CarListingFormData, userId: string, valuationData: any) => {
  console.log('Starting car data preparation with valuation data:', valuationData);

  // Validate required valuation data
  if (!valuationData?.make || !valuationData?.model || !valuationData?.vin || 
      !valuationData?.mileage || !valuationData?.valuation || !valuationData?.year) {
    console.error('Missing required valuation data:', valuationData);
    throw new Error("Please complete the vehicle valuation first");
  }

  // Generate and validate title
  const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`.trim();
  if (!title) {
    console.error('Failed to generate valid title from:', { make: valuationData.make, model: valuationData.model, year: valuationData.year });
    throw new Error("Unable to generate listing title from valuation data");
  }

  console.log('Generated title:', title);

  const carData = {
    seller_id: userId,
    title,
    vin: valuationData.vin,
    mileage: valuationData.mileage,
    price: valuationData.valuation,
    make: valuationData.make,
    model: valuationData.model,
    year: valuationData.year,
    valuation_data: valuationData,
    name: data.name,
    address: data.address,
    mobile_number: data.mobileNumber,
    is_damaged: data.isDamaged,
    is_registered_in_poland: data.isRegisteredInPoland,
    features: prepareCarFeatures(data.features),
    seat_material: data.seatMaterial,
    number_of_keys: parseInt(data.numberOfKeys),
    has_tool_pack: data.hasToolPack,
    has_documentation: data.hasDocumentation,
    is_selling_on_behalf: data.isSellingOnBehalf,
    has_private_plate: data.hasPrivatePlate,
    finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
    service_history_type: data.serviceHistoryType,
    seller_notes: data.sellerNotes,
    required_photos: data.uploadedPhotos,
    is_draft: false
  };

  console.log('Prepared car data:', carData);
  return carData;
};