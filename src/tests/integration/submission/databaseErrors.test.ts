
/**
 * Created: 2025-08-15
 * Test for database error handling in form submission
 */

import { describe, it, expect, vi } from '../../vitest-stub';
import { submitCarListing } from '@/components/forms/car-listing/submission/services/submissionService';
import { prepareCarDataForSubmission } from '@/components/forms/car-listing/submission/utils/dataPreparation';
import { validateCarData, validateValuationData } from '@/components/forms/car-listing/submission/utils/validationHandler';
import { setupUtilityMocks, resetAllMocks } from '../helpers/mockUtilities';
import { createMockFormData, mockDatabaseError } from '../helpers/testHelpers';

describe('Form Submission - Database Errors', () => {
  beforeEach(() => {
    resetAllMocks();
  });
  
  it('should handle database errors', async () => {
    // Setup mocks
    const mockFormData = createMockFormData();
    const dbError = mockDatabaseError();
    
    const mockPreparedData = { ...mockFormData };
    
    // Mock implementation
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ isValid: true, errors: [] });
    vi.mocked(validateValuationData).mockReturnValue(mockFormData);
    
    // Execute the test with the corrected function name and parameters
    const result = await submitCarListing(mockFormData, 'mock-user-id');
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toContain('Database error');
    expect(prepareCarDataForSubmission).toHaveBeenCalled();
    expect(validateCarData).toHaveBeenCalled();
  });
});
