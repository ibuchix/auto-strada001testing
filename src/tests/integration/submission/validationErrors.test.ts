
/**
 * Created: 2025-08-15
 * Test for validation error handling in form submission
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

describe('Form Submission - Validation Errors', () => {
  beforeEach(() => {
    resetAllMocks();
  });
  
  it('should handle validation errors', async () => {
    // Setup mocks
    const mockFormData = createMockFormData({ 
      make: 'Toyota',
      // Missing required fields
    });
    
    const mockPreparedData = { ...mockFormData };
    const mockErrors = ['Missing required field: model', 'Missing required field: year'];
    
    // Mock implementation with validation errors
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ 
      isValid: false, 
      errors: mockErrors
    });
    vi.mocked(validateValuationData).mockImplementation(() => {
      throw new Error(mockErrors.join(', '));
    });
    
    // Execute the test with the corrected function name and parameters
    const result = await submitCarListing(mockFormData, 'mock-user-id');
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(prepareCarDataForSubmission).not.toHaveBeenCalled();
    expect(validateCarData).not.toHaveBeenCalled();
    expect(calculateReservePrice).not.toHaveBeenCalled();
    expect(cleanupStorage).not.toHaveBeenCalled();
  });
});
