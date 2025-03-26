
/**
 * Changes made:
 * - 2024-07-24: Created forms.ts to define form data types
 */

export interface CarListingFormData {
  vin: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  mileage: number;
  engineCapacity: number;
  transmission: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  numberOfDoors: string;
  seatMaterial: string;
  numberOfKeys: string;
  price: string;
  location: string;
  description: string;
  name: string;
  address: string;
  mobileNumber: string;
  contactEmail: string;
  notes: string;
  previousOwners: number;
  accidentHistory: string;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  financeAmount: string;
  serviceHistoryType: string;
  sellerNotes: string;
  conditionRating: number;
  features: {
    satNav: boolean;
    panoramicRoof: boolean;
    reverseCamera: boolean;
    heatedSeats: boolean;
    upgradedSound: boolean;
  };
  uploadedPhotos: string[];
  additionalPhotos: string[];
  requiredPhotos: {
    front: string | null;
    rear: string | null;
    interior: string | null;
    engine: string | null;
  };
  rimPhotos: {
    front_left: string | null;
    front_right: string | null;
    rear_left: string | null;
    rear_right: string | null;
  };
  warningLightPhotos: string[];
  rimPhotosComplete: boolean;
  financeDocument: string | null;
  serviceHistoryFiles: string[];
  userId?: string;
}
