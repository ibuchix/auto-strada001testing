
/**
 * Utilities for transforming data between database and form formats
 */

import { CarListingFormData, defaultCarFeatures, carFeaturesToJson } from "@/types/forms";

/**
 * Transforms database car data to form data format
 */
export const transformDbToFormData = (dbData: any): Partial<CarListingFormData> => {
  if (!dbData) return {};

  return {
    name: dbData.seller_name || dbData.name || "",
    address: dbData.address || "",
    mobileNumber: dbData.mobile_number || "",
    features: dbData.features || defaultCarFeatures,
    isDamaged: dbData.is_damaged || false,
    isRegisteredInPoland: dbData.is_registered_in_poland || false,
    isSellingOnBehalf: dbData.is_selling_on_behalf || false,
    hasPrivatePlate: dbData.has_private_plate || false,
    financeAmount: dbData.finance_amount ? String(dbData.finance_amount) : "",
    serviceHistoryType: dbData.service_history_type || "none",
    sellerNotes: dbData.seller_notes || "",
    seatMaterial: dbData.seat_material || "cloth",
    numberOfKeys: dbData.number_of_keys ? String(dbData.number_of_keys) : "1",
    transmission: dbData.transmission || "manual",
    uploadedPhotos: dbData.additional_photos || [],
    // Support for newer properties
    vin: dbData.vin || "",
    make: dbData.make || "",
    model: dbData.model || "",
    year: dbData.year || new Date().getFullYear(),
    mileage: dbData.mileage || 0,
    registrationNumber: dbData.registration_number || "",
    engineCapacity: dbData.engine_capacity || 0,
    damageReports: dbData.damage_reports || []
  };
};

/**
 * Transforms API data to form data format (used specifically for API responses)
 */
export const transformApiDataToFormData = (apiData: any): Partial<CarListingFormData> => {
  return transformDbToFormData(apiData);
};

/**
 * Transforms form data to database format
 */
export const transformFormToDbData = (formData: Partial<CarListingFormData>): Record<string, any> => {
  const dbData: Record<string, any> = {
    seller_name: formData.name,
    name: formData.name, // Keep both for backward compatibility
    address: formData.address,
    mobile_number: formData.mobileNumber,
    features: carFeaturesToJson(formData.features || defaultCarFeatures),
    is_damaged: formData.isDamaged || false,
    is_registered_in_poland: formData.isRegisteredInPoland || false,
    is_selling_on_behalf: formData.isSellingOnBehalf || false,
    has_private_plate: formData.hasPrivatePlate || false,
    finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
    service_history_type: formData.serviceHistoryType || "none",
    seller_notes: formData.sellerNotes || "",
    seat_material: formData.seatMaterial || "cloth",
    number_of_keys: formData.numberOfKeys ? parseInt(formData.numberOfKeys, 10) : 1,
    transmission: formData.transmission || "manual",
    additional_photos: formData.uploadedPhotos || []
  };

  // Add newer properties if they exist
  if (formData.vin) dbData.vin = formData.vin;
  if (formData.make) dbData.make = formData.make;
  if (formData.model) dbData.model = formData.model;
  if (formData.year) dbData.year = formData.year;
  if (formData.mileage) dbData.mileage = formData.mileage;
  if (formData.registrationNumber) dbData.registration_number = formData.registrationNumber;
  if (formData.engineCapacity) dbData.engine_capacity = formData.engineCapacity;
  if (formData.damageReports) dbData.damage_reports = formData.damageReports;

  return dbData;
};
