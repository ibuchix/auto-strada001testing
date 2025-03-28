
/**
 * Changes made:
 * - Refined type definitions for form defaults
 * - Added type-safe implementation for form initialization
 * - Enhanced type guarantees for required fields
 * - Improved default value generation
 */

import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

// Type for guaranteed required fields (matches database NOT NULL columns)
type FormDefaults = Pick<CarListingFormData, 
  'make' | 'model' | 'year' | 'price' | 'mileage' | 'vin' | 'transmission' | 'features'
> & {
  // Add other required fields with their default values
  isRegisteredInPoland: boolean;
  serviceHistoryType: string;
  numberOfKeys: string;
};

/**
 * Returns validated default values for car listing form
 * Ensures compatibility with database schema constraints
 */
export const getFormDefaults = (): FormDefaults => ({
  // Core required fields
  make: '',
  model: '',
  year: new Date().getFullYear(),
  price: 0,
  mileage: 0,
  vin: '',
  transmission: 'manual', // Default to manual instead of null

  // Required features with defaults
  features: defaultCarFeatures,

  // Required form-specific defaults
  isRegisteredInPoland: true,
  serviceHistoryType: 'none',
  numberOfKeys: '2'
});

/**
 * Returns complete initial values for form reset
 * Combines database defaults with UI-specific defaults
 */
export const getInitialFormValues = (): CarListingFormData => ({
  ...getFormDefaults(),
  // Optional fields
  name: '',
  address: '',
  mobileNumber: '',
  damageReports: [],
  uploadedPhotos: [],
  sellerNotes: '',
  isDamaged: false,
  isSellingOnBehalf: false,
  hasPrivatePlate: false,
  // Transient form state
  form_metadata: {
    currentStep: 0,
    lastSavedAt: new Date().toISOString()
  }
});

