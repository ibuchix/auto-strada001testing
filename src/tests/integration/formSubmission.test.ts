
/**
 * Changes made:
 * - 2024-08-04: Fixed import for defaultCarFeatures and updated test data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitCarListing } from '../../components/forms/car-listing/submission/services/submissionService';
import { validateFormData } from '../../components/forms/car-listing/utils/validation';
import { CarListingFormData, defaultCarFeatures } from '../../types/forms';

// Mock supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 'test-id' }], error: null }),
  },
}));

describe('Form Submission Integration Tests', () => {
  const mockUserId = 'test-user-id';
  let mockFormData: Partial<CarListingFormData>;

  beforeEach(() => {
    mockFormData = {
      name: 'Test User',
      address: '123 Test St',
      mobileNumber: '+1234567890',
      features: defaultCarFeatures,
      isDamaged: false,
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: '',
      serviceHistoryType: 'full',
      sellerNotes: 'Test notes',
      numberOfKeys: '2',
      transmission: 'automatic',
      vin: 'ABC123456789',
      make: 'Test Make',
      model: 'Test Model',
      year: 2020,
      registrationNumber: 'ABC123',
      mileage: 10000,
      engineCapacity: 2000,
      bodyType: 'sedan',
      exteriorColor: 'black',
      interiorColor: 'black',
      numberOfDoors: '4',
      price: '20000',
      location: 'Test City',
      description: 'Test description',
      contactEmail: 'test@example.com',
      notes: 'Test notes',
      previousOwners: 1,
      accidentHistory: 'none',
      conditionRating: 4,
      uploadedPhotos: ['test-photo.jpg'],
      additionalPhotos: [],
      requiredPhotos: {
        front: 'front.jpg',
        rear: 'rear.jpg',
        interior: 'interior.jpg',
        engine: 'engine.jpg',
      },
      rimPhotos: {
        front_left: 'front_left.jpg',
        front_right: 'front_right.jpg',
        rear_left: 'rear_left.jpg',
        rear_right: 'rear_right.jpg',
      },
      warningLightPhotos: [],
      rimPhotosComplete: true,
      financeDocument: null,
      serviceHistoryFiles: [],
      damageReports: []
    } as CarListingFormData;
  });

  it('validates form data correctly', () => {
    const errors = validateFormData(mockFormData);
    expect(errors).toHaveLength(0);
  });

  it('validates form data and returns errors for missing fields', () => {
    const incompleteData = {
      ...mockFormData,
      name: '',
      uploadedPhotos: [],
    } as CarListingFormData;

    const errors = validateFormData(incompleteData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'name')).toBe(true);
    expect(errors.some(e => e.field === 'uploadedPhotos')).toBe(true);
  });

  it('submits form data successfully', async () => {
    const result = await submitCarListing(mockFormData as CarListingFormData, mockUserId);
    expect(result).toBeDefined();
    expect(result.id).toBe('test-id');
  });
});
