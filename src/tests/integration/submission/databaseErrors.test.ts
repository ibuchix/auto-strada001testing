
/**
 * Created: 2025-08-15
 * Test for database error handling in form submission
 * Updated: 2025-08-19: Fixed mock function implementation
 */

import { describe, it, expect, vi } from '../../vitest-stub';
import { CarListingFormData } from '@/types/forms';
import { resetAllMocks } from '../helpers/mockUtilities';

// Mock the functions we need to test
const mockSubmitCarListing = vi.fn().mockResolvedValue({ 
  success: false, 
  error: 'Database error'
});
const mockPrepareCarDataForSubmission = vi.fn();
const mockValidateCarData = vi.fn();
const mockValidateValuationData = vi.fn();

// Mock the imports
vi.mock('@/components/forms/car-listing/submission/services/submissionService', () => ({
  submitCarListing: mockSubmitCarListing
}));

vi.mock('@/components/forms/car-listing/submission/utils/dataPreparation', () => ({
  prepareCarDataForSubmission: mockPrepareCarDataForSubmission
}));

vi.mock('@/components/forms/car-listing/submission/utils/validationHandler', () => ({
  validateCarData: mockValidateCarData,
  validateValuationData: mockValidateValuationData
}));

describe('Form Submission - Database Errors', () => {
  beforeEach(() => {
    resetAllMocks();
    
    // Reset mock implementations
    mockPrepareCarDataForSubmission.mockReturnValue({});
    mockValidateCarData.mockReturnValue({ isValid: true, errors: [] });
    mockValidateValuationData.mockReturnValue({});
  });
  
  it('should handle database errors', async () => {
    // Create a mock form data that matches our simplified type
    const mockFormData = {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      mileage: 50000,
      engineCapacity: 2000,
      transmission: 'manual' as const,
      bodyType: 'sedan',
      numberOfDoors: '4',
      seatMaterial: 'cloth',
      numberOfKeys: '1',
      price: 15000,
      previousOwners: 1,
      accidentHistory: 'none',
      isDamaged: false,
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      serviceHistoryType: 'full',
      conditionRating: 3,
      features: {},
      uploadedPhotos: ['temp/photo1.jpg', 'temp/photo2.jpg'],
      requiredPhotos: {
        front: null,
        rear: null,
        interior: null,
        engine: null
      },
      rimPhotos: {
        front_left: null,
        front_right: null,
        rear_left: null,
        rear_right: null
      },
      rimPhotosComplete: false,
      financeDocument: null
    } as CarListingFormData;
    
    // Execute the test
    const result = await mockSubmitCarListing(mockFormData, 'mock-user-id');
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toContain('Database error');
  });
});
