
/**
 * Default values for car listing form
 * Updated: 2025-07-24 - Added missing CarFeatures properties
 */

export const DEFAULT_VALUES = {
  isSellingOnBehalf: false,
  hasServiceHistory: false,
  hasPrivatePlate: false,
  hasOutstandingFinance: false,
  isDamaged: false,
  make: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  vin: "",
  price: 0,
  transmission: "manual",
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
    upgradedSound: false
  },
  seller_id: "",
  serviceHistoryType: "none"
};
