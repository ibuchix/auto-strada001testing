
/**
 * Created: 2025-08-19
 * Type definitions for form data
 */

// Simplified version of the car listing form data type for tests
export interface CarListingFormData {
  make: string;
  model: string;
  year: number;
  vin?: string;
  registrationNumber?: string;
  mileage: number;
  engineCapacity: number;
  transmission: 'manual' | 'automatic';
  bodyType: string;
  exteriorColor?: string;
  interiorColor?: string;
  numberOfDoors: string;
  seatMaterial: string;
  numberOfKeys: string;
  price: string | number;
  location?: string;
  description?: string;
  name?: string;
  address?: string;
  mobileNumber?: string;
  contactEmail?: string;
  notes?: string;
  previousOwners: number;
  accidentHistory: string;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  financeAmount?: string;
  serviceHistoryType: string;
  sellerNotes?: string;
  conditionRating: number;
  features: {
    satNav?: boolean;
    panoramicRoof?: boolean;
    reverseCamera?: boolean;
    heatedSeats?: boolean;
    upgradedSound?: boolean;
    [key: string]: boolean | undefined;
  };
  uploadedPhotos: string[];
  additionalPhotos?: string[];
  requiredPhotos: {
    front: File | null;
    rear: File | null;
    interior: File | null;
    engine: File | null;
  };
  rimPhotos: {
    front_left: File | null;
    front_right: File | null;
    rear_left: File | null;
    rear_right: File | null;
  };
  warningLightPhotos?: string[];
  rimPhotosComplete: boolean;
  financeDocument: File | null;
  serviceHistoryFiles?: string[];
  userId?: string;
}
