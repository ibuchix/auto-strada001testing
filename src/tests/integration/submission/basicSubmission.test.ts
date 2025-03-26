
/**
 * Created: 2025-08-15
 * Test for basic form submission functionality
 */

import { describe, it, expect, vi } from '../../vitest-stub';
import { submitCarListing } from '@/components/forms/car-listing/submission/services/submissionService';
import { prepareCarDataForSubmission } from '@/components/forms/car-listing/submission/utils/dataPreparation';
import { validateCarData, validateValuationData } from '@/components/forms/car-listing/submission/utils/validationHandler';
import { calculateReservePrice } from '@/components/forms/car-listing/submission/utils/reservePriceCalculator';
import { cleanupStorage } from '@/components/forms/car-listing/submission/utils/storageCleanup';
import { setupUtilityMocks, resetAllMocks } from '../helpers/mockUtilities';
import { mockSupabase, createMockFormData } from '../helpers/testHelpers';

// Mock the dependencies
mockSupabase();
const mocks = setupUtilityMocks();

describe('Basic Form Submission', () => {
  beforeEach(() => {
    resetAllMocks();
  });
  
  it('should process form submission successfully', async () => {
    // Setup mocks
    const mockFormData = createMockFormData();
    
    const mockPreparedData = {
      ...mockFormData,
      price: 15000,
      features: { satNav: true, panoramicRoof: false, heatedSeats: true, reverseCamera: true, upgradedSound: false }
    };
    
    const mockReservePrice = 10000;
    
    // Mock implementation of utility functions
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ isValid: true, errors: [] });
    vi.mocked(validateValuationData).mockReturnValue(mockFormData);
    vi.mocked(calculateReservePrice).mockReturnValue(mockReservePrice);
    vi.mocked(cleanupStorage).mockResolvedValue(undefined);
    
    // Execute the test using the corrected function name and parameters
    const result = await submitCarListing(mockFormData, 'mock-user-id');
    
    // Assertions
    expect(result.success).toBe(true);
    expect(result.carId).toBeDefined();
    expect(prepareCarDataForSubmission).toHaveBeenCalled();
    expect(validateCarData).toHaveBeenCalled();
    expect(calculateReservePrice).toHaveBeenCalled();
    expect(cleanupStorage).toHaveBeenCalled();
  });
});
