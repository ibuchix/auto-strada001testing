
/**
 * Changes made:
 * - 2024-08-04: Fixed import for defaultCarFeatures
 */

import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

/**
 * Transforms form data for API submission
 */
export const transformFormDataForSubmission = (data: CarListingFormData): Record<string, any> => {
  return {
    title: `${data.make} ${data.model} ${data.year}`,
    vin: data.vin,
    make: data.make,
    model: data.model,
    year: data.year,
    mileage: Number(data.mileage),
    price: Number(data.price),
    transmission: data.transmission,
    body_type: data.bodyType,
    exterior_color: data.exteriorColor,
    interior_color: data.interiorColor,
    engine_capacity: Number(data.engineCapacity),
    number_of_doors: Number(data.numberOfDoors),
    seat_material: data.seatMaterial,
    number_of_keys: Number(data.numberOfKeys),
    description: data.description,
    location: data.location,
    seller_name: data.name,
    address: data.address,
    mobile_number: data.mobileNumber,
    contact_email: data.contactEmail,
    notes: data.notes,
    previous_owners: Number(data.previousOwners),
    accident_history: data.accidentHistory,
    is_damaged: data.isDamaged,
    is_registered_in_poland: data.isRegisteredInPoland,
    is_selling_on_behalf: data.isSellingOnBehalf,
    has_private_plate: data.hasPrivatePlate,
    finance_amount: data.financeAmount ? Number(data.financeAmount) : null,
    service_history_type: data.serviceHistoryType,
    seller_notes: data.sellerNotes,
    condition_rating: data.conditionRating,
    features: data.features || defaultCarFeatures,
    photos: data.uploadedPhotos || [],
    additional_photos: data.additionalPhotos || [],
    required_photos: data.requiredPhotos || {},
    rim_photos: data.rimPhotos || {},
    warning_light_photos: data.warningLightPhotos || [],
    rim_photos_complete: data.rimPhotosComplete,
    finance_document: data.financeDocument,
    service_history_files: data.serviceHistoryFiles || [],
    damage_reports: data.damageReports || []
  };
};

/**
 * Transforms API data to form data format
 */
export const transformApiDataToFormData = (apiData: Record<string, any>): Partial<CarListingFormData> => {
  return {
    vin: apiData.vin || "",
    make: apiData.make || "",
    model: apiData.model || "",
    year: apiData.year || new Date().getFullYear(),
    mileage: apiData.mileage || 0,
    price: String(apiData.price || ""),
    transmission: apiData.transmission || "manual",
    bodyType: apiData.body_type || "sedan",
    exteriorColor: apiData.exterior_color || "",
    interiorColor: apiData.interior_color || "",
    engineCapacity: apiData.engine_capacity || 0,
    numberOfDoors: String(apiData.number_of_doors || "4"),
    seatMaterial: apiData.seat_material || "cloth",
    numberOfKeys: String(apiData.number_of_keys || "1"),
    description: apiData.description || "",
    location: apiData.location || "",
    name: apiData.seller_name || "",
    address: apiData.address || "",
    mobileNumber: apiData.mobile_number || "",
    contactEmail: apiData.contact_email || "",
    notes: apiData.notes || "",
    previousOwners: apiData.previous_owners || 1,
    accidentHistory: apiData.accident_history || "none",
    isDamaged: apiData.is_damaged || false,
    isRegisteredInPoland: apiData.is_registered_in_poland || true,
    isSellingOnBehalf: apiData.is_selling_on_behalf || false,
    hasPrivatePlate: apiData.has_private_plate || false,
    financeAmount: String(apiData.finance_amount || ""),
    serviceHistoryType: apiData.service_history_type || "none",
    sellerNotes: apiData.seller_notes || "",
    conditionRating: apiData.condition_rating || 3,
    features: apiData.features || defaultCarFeatures,
    uploadedPhotos: apiData.photos || [],
    additionalPhotos: apiData.additional_photos || [],
    requiredPhotos: apiData.required_photos || {
      front: null,
      rear: null,
      interior: null,
      engine: null
    },
    rimPhotos: apiData.rim_photos || {
      front_left: null,
      front_right: null,
      rear_left: null,
      rear_right: null
    },
    warningLightPhotos: apiData.warning_light_photos || [],
    rimPhotosComplete: apiData.rim_photos_complete || false,
    financeDocument: apiData.finance_document || null,
    serviceHistoryFiles: apiData.service_history_files || [],
    damageReports: apiData.damage_reports || []
  };
};
