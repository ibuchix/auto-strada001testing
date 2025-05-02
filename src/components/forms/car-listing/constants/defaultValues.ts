
/**
 * Default values for the car listing form
 * Created: 2025-06-05 to fix missing import error
 */

import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

export const defaultValues: Partial<CarListingFormData> = {
  // Vehicle details
  make: '',
  model: '',
  year: new Date().getFullYear(),
  transmission: 'manual',
  mileage: 0,
  vin: '',
  price: 0,
  
  // Vehicle status
  isDamaged: false,
  isRegisteredInPoland: true,
  isSellingOnBehalf: false,
  hasPrivatePlate: false,
  
  // Features
  features: defaultCarFeatures,
  
  // Service history
  serviceHistoryType: 'none',
  serviceHistoryFiles: [],
  numberOfKeys: '2',
  
  // Images
  uploadedPhotos: [],
  
  // Seller information
  name: '',
  address: '',
  mobileNumber: '',
  sellerNotes: '',
  
  // Damage reports
  damageReports: [],
  
  // Form metadata
  form_metadata: {
    currentStep: 0,
    lastSavedAt: new Date().toISOString()
  }
};
