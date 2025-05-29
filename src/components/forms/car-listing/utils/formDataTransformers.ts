
/**
 * Form Data Transformation Utilities
 * Updated: 2025-05-24 - Updated field names to use camelCase consistently for frontend
 * Updated: 2025-05-24 - Fixed field naming consistency issues
 * Updated: 2025-05-29 - REMOVED price field - using only reservePrice
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Transform form data from camelCase (frontend) to snake_case (database)
 */
export const transformToSnakeCase = (formData: CarListingFormData): Record<string, any> => {
  const transformed: Record<string, any> = {};
  
  // Direct mappings
  if (formData.reservePrice !== undefined) transformed.reserve_price = formData.reservePrice;
  if (formData.sellerId !== undefined) transformed.seller_id = formData.sellerId;
  if (formData.sellerName !== undefined) transformed.seller_name = formData.sellerName;
  if (formData.mobileNumber !== undefined) transformed.mobile_number = formData.mobileNumber;
  if (formData.registrationNumber !== undefined) transformed.registration_number = formData.registrationNumber;
  if (formData.hasPrivatePlate !== undefined) transformed.has_private_plate = formData.hasPrivatePlate;
  if (formData.hasServiceHistory !== undefined) transformed.has_service_history = formData.hasServiceHistory;
  if (formData.serviceHistoryType !== undefined) transformed.service_history_type = formData.serviceHistoryType;
  if (formData.isRegisteredInPoland !== undefined) transformed.is_registered_in_poland = formData.isRegisteredInPoland;
  if (formData.isDamaged !== undefined) transformed.is_damaged = formData.isDamaged;
  if (formData.financeAmount !== undefined) transformed.finance_amount = formData.financeAmount;
  if (formData.numberOfKeys !== undefined) transformed.number_of_keys = formData.numberOfKeys;
  if (formData.seatMaterial !== undefined) transformed.seat_material = formData.seatMaterial;
  if (formData.sellerNotes !== undefined) transformed.seller_notes = formData.sellerNotes;
  if (formData.auctionEndTime !== undefined) transformed.auction_end_time = formData.auctionEndTime;
  if (formData.auctionStatus !== undefined) transformed.auction_status = formData.auctionStatus;
  if (formData.currentBid !== undefined) transformed.current_bid = formData.currentBid;
  if (formData.isAuction !== undefined) transformed.is_auction = formData.isAuction;
  if (formData.additionalPhotos !== undefined) transformed.additional_photos = formData.additionalPhotos;
  if (formData.requiredPhotos !== undefined) transformed.required_photos = formData.requiredPhotos;
  if (formData.formMetadata !== undefined) transformed.form_metadata = formData.formMetadata;
  if (formData.valuationData !== undefined) transformed.valuation_data = formData.valuationData;
  if (formData.lastSaved !== undefined) transformed.last_saved = formData.lastSaved;
  
  // Copy over fields that don't need transformation
  ['id', 'make', 'model', 'year', 'mileage', 'vin', 'transmission', 'features', 'title', 'status', 'images', 'address'].forEach(field => {
    if (formData[field] !== undefined) {
      transformed[field] = formData[field];
    }
  });
  
  return transformed;
};

/**
 * Transform data from snake_case (database) to camelCase (frontend)
 */
export const transformToCamelCase = (dbData: Record<string, any>): Partial<CarListingFormData> => {
  const transformed: Partial<CarListingFormData> = {};
  
  // Direct mappings
  if (dbData.reserve_price !== undefined) transformed.reservePrice = dbData.reserve_price;
  if (dbData.seller_id !== undefined) transformed.sellerId = dbData.seller_id;
  if (dbData.seller_name !== undefined) transformed.sellerName = dbData.seller_name;
  if (dbData.mobile_number !== undefined) transformed.mobileNumber = dbData.mobile_number;
  if (dbData.registration_number !== undefined) transformed.registrationNumber = dbData.registration_number;
  if (dbData.has_private_plate !== undefined) transformed.hasPrivatePlate = dbData.has_private_plate;
  if (dbData.has_service_history !== undefined) transformed.hasServiceHistory = dbData.has_service_history;
  if (dbData.service_history_type !== undefined) transformed.serviceHistoryType = dbData.service_history_type;
  if (dbData.is_registered_in_poland !== undefined) transformed.isRegisteredInPoland = dbData.is_registered_in_poland;
  if (dbData.is_damaged !== undefined) transformed.isDamaged = dbData.is_damaged;
  if (dbData.finance_amount !== undefined) transformed.financeAmount = dbData.finance_amount;
  if (dbData.number_of_keys !== undefined) transformed.numberOfKeys = dbData.number_of_keys;
  if (dbData.seat_material !== undefined) transformed.seatMaterial = dbData.seat_material;
  if (dbData.seller_notes !== undefined) transformed.sellerNotes = dbData.seller_notes;
  if (dbData.auction_end_time !== undefined) transformed.auctionEndTime = dbData.auction_end_time;
  if (dbData.auction_status !== undefined) transformed.auctionStatus = dbData.auction_status;
  if (dbData.current_bid !== undefined) transformed.currentBid = dbData.current_bid;
  if (dbData.is_auction !== undefined) transformed.isAuction = dbData.is_auction;
  if (dbData.additional_photos !== undefined) transformed.additionalPhotos = dbData.additional_photos;
  if (dbData.required_photos !== undefined) transformed.requiredPhotos = dbData.required_photos;
  if (dbData.form_metadata !== undefined) transformed.formMetadata = dbData.form_metadata;
  if (dbData.valuation_data !== undefined) transformed.valuationData = dbData.valuation_data;
  if (dbData.last_saved !== undefined) transformed.lastSaved = dbData.last_saved;
  
  // Copy over fields that don't need transformation
  ['id', 'make', 'model', 'year', 'mileage', 'vin', 'transmission', 'features', 'title', 'status', 'images', 'address'].forEach(field => {
    if (dbData[field] !== undefined) {
      transformed[field] = dbData[field];
    }
  });
  
  return transformed;
};
