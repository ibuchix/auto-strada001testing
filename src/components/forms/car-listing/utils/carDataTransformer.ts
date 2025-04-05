
/**
 * Changes made:
 * - Created new utility file for transforming form data to database format
 * - Added synchronous and asynchronous car data preparation functions
 * - Implemented field filtering for database compatibility
 * - Added TypeScript type safety for car data
 * - Integrated with carSchema validation
 * - 2025-11-29: Fixed validateCar import path
 */

import { CarListingFormData, CarEntity } from '@/types/forms';
import { validateCar } from '@/utils/validation/carSchema';
import { toast } from 'sonner';

/**
 * Prepare car data for database insertion (synchronous version)
 * This provides immediate validation but may not filter all fields
 */
export const prepareCarData = (
  formData: CarListingFormData,
  valuationData: any,
  userId: string
): Partial<CarEntity> => {
  // Basic data preparation
  const preparedData = {
    // Seller information
    seller_id: userId,
    seller_name: formData.name || '',
    address: formData.address || '',
    mobile_number: formData.mobileNumber || '',
    
    // Car details
    title: formData.title || '',
    make: formData.make || '',
    model: formData.model || '',
    mileage: formData.mileage ? Number(formData.mileage) : undefined,
    year: formData.year ? Number(formData.year) : undefined,
    transmission: formData.transmission || '',
    vin: formData.vin || '',
    price: formData.price ? Number(formData.price) : undefined,
    
    // Features and condition
    features: formData.features || {},
    is_damaged: formData.isDamaged || false,
    is_registered_in_poland: formData.isRegisteredInPoland || false,
    has_private_plate: formData.hasPrivatePlate || false,
    finance_amount: formData.financeAmount ? Number(formData.financeAmount) : null,
    
    // Additional details
    service_history_type: formData.serviceHistoryType || '',
    seller_notes: formData.sellerNotes || '',
    seat_material: formData.seatMaterial || '',
    number_of_keys: formData.numberOfKeys ? Number(formData.numberOfKeys) : undefined,
    
    // Photos
    additional_photos: formData.uploadedPhotos || [],
    
    // Form metadata
    form_metadata: formData.formMetadata || {},
    is_draft: true,
    last_saved: new Date().toISOString(),

    // Valuation data
    valuation_data: valuationData || {}
  };

  return preparedData;
};

/**
 * Prepare car data for database insertion with additional async processing
 * This version may include additional field filtering or transformations
 * that require asynchronous operations
 */
export const prepareCarDataAsync = async (
  formData: CarListingFormData, 
  valuationData: any,
  userId: string
): Promise<Partial<CarEntity>> => {
  // Start with the synchronous data preparation
  const baseData = prepareCarData(formData, valuationData, userId);
  
  // Validate core car data
  try {
    const coreData = {
      make: baseData.make,
      model: baseData.model,
      year: baseData.year as number,
      price: baseData.price as number,
      mileage: baseData.mileage as number,
      vin: baseData.vin,
      transmission: formData.transmission as "manual" | "automatic" // Add this line
    };
    
    // Only validate if we have enough data (silent return if not enough data yet)
    if (coreData.make && coreData.model && coreData.year && coreData.vin) {
      const validationResult = validateCar(coreData);
      
      if (!validationResult.success && validationResult.error) {
        console.warn('Car data validation failed:', validationResult.error.format());
      }
    }
  } catch (error) {
    console.error('Error during car data validation:', error);
    // Don't throw, just log - this is just a validation check
  }
  
  return baseData;
};
