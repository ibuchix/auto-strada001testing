
/**
 * Default values for car listing form
 * Updated: 2025-07-24 - Added missing CarFeatures properties
 * Updated: 2025-07-25 - Added all missing feature flags
 * Updated: 2025-07-26 - Fixed types to match CarFeatures interface
 * Updated: 2025-05-04 - Ensured proper typing for enum values
 * Updated: 2025-05-06 - Fixed serviceHistoryType type to ensure it's properly typed
 * Updated: 2025-05-07 - Explicit typing for all enum values
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 */

export const DEFAULT_VALUES = {
  is_selling_on_behalf: false,
  has_service_history: false,
  has_private_plate: false,
  has_outstanding_finance: false,
  is_damaged: false,
  make: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  vin: "",
  price: 0,
  transmission: "manual" as const,
  features: {
    airConditioning: false,
    bluetooth: false,
    cruiseControl: false,
    leatherSeats: false,
    navigation: false,
    parkingSensors: false,
    sunroof: false,
    satNav: false,
    panoramicRoof: false,
    reverseCamera: false,
    heatedSeats: false,
    upgradedSound: false,
    alloyWheels: false,
    keylessEntry: false,
    adaptiveCruiseControl: false,
    laneDepartureWarning: false
  },
  seller_id: "",
  service_history_type: "none" as "none" | "partial" | "full",
  from_valuation: false
};
