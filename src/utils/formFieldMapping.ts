
/**
 * Form Field Mapping Utility
 * Created: 2025-05-26
 * Updated: 2025-05-27 - Added additional field mappings and fixed type inconsistencies
 * Updated: 2025-06-21 - Added verification_status and is_verified mappings for seller registration
 * 
 * This utility helps with mapping between frontend camelCase field names
 * and backend snake_case field names for consistent data handling.
 */

type FieldMapEntry = {
  frontend: string; // camelCase for frontend
  backend: string;  // snake_case for backend
};

// Define mappings for field names that need transformation
export const FIELD_MAPPINGS: FieldMapEntry[] = [
  { frontend: 'reservePrice', backend: 'reserve_price' },
  { frontend: 'isSellingOnBehalf', backend: 'is_selling_on_behalf' },
  { frontend: 'hasServiceHistory', backend: 'has_service_history' },
  { frontend: 'hasPrivatePlate', backend: 'has_private_plate' },
  { frontend: 'hasOutstandingFinance', backend: 'has_outstanding_finance' },
  { frontend: 'isDamaged', backend: 'is_damaged' },
  { frontend: 'serviceHistoryType', backend: 'service_history_type' },
  { frontend: 'serviceHistoryFiles', backend: 'service_history_files' },
  { frontend: 'valuationData', backend: 'valuation_data' },
  { frontend: 'requiredPhotos', backend: 'required_photos' },
  { frontend: 'fromValuation', backend: 'from_valuation' },
  { frontend: 'sellerName', backend: 'seller_name' },
  { frontend: 'mobileNumber', backend: 'mobile_number' },
  { frontend: 'registrationNumber', backend: 'registration_number' },
  { frontend: 'financeAmount', backend: 'finance_amount' },
  { frontend: 'numberOfKeys', backend: 'number_of_keys' },
  { frontend: 'isRegisteredInPoland', backend: 'is_registered_in_poland' },
  { frontend: 'seatMaterial', backend: 'seat_material' },
  { frontend: 'sellerNotes', backend: 'seller_notes' },
  { frontend: 'formMetadata', backend: 'form_metadata' },
  { frontend: 'auctionEndTime', backend: 'auction_end_time' },
  { frontend: 'currentBid', backend: 'current_bid' },
  { frontend: 'auctionStatus', backend: 'auction_status' },
  { frontend: 'isDraft', backend: 'is_draft' },
  { frontend: 'isAuction', backend: 'is_auction' },
  { frontend: 'additionalPhotos', backend: 'additional_photos' },
  { frontend: 'sellerId', backend: 'seller_id' },
  { frontend: 'verificationStatus', backend: 'verification_status' },
  { frontend: 'isVerified', backend: 'is_verified' },
];

// Get backend field name from frontend field name
export const getBackendFieldName = (frontendName: string): string => {
  const mapping = FIELD_MAPPINGS.find(m => m.frontend === frontendName);
  return mapping ? mapping.backend : frontendName;
};

// Get frontend field name from backend field name
export const getFrontendFieldName = (backendName: string): string => {
  const mapping = FIELD_MAPPINGS.find(m => m.backend === backendName);
  return mapping ? mapping.frontend : backendName;
};

// Convert an object with frontend field names to backend field names
export const convertToBackendFields = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const backendKey = getBackendFieldName(key);
      result[backendKey] = obj[key];
    }
  }
  
  return result;
};

// Convert an object with backend field names to frontend field names
export const convertToFrontendFields = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const frontendKey = getFrontendFieldName(key);
      result[frontendKey] = obj[key];
    }
  }
  
  return result;
};
