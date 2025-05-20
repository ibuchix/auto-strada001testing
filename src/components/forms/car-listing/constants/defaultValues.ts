
/**
 * Default Values for Car Listing Form
 * Created: 2025-05-26
 * Defines the default values for the car listing form in camelCase for frontend use
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
    upgradedSound: false,
    alloyWheels: false,
    keylessEntry: false,
    adaptiveCruiseControl: false,
    laneDepartureWarning: false
  },
  sellerId: "",
  serviceHistoryType: "none",
  fromValuation: false
};
