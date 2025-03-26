/**
 * Changes made:
 * - 2024-10-25: Fixed property access to use carId instead of id
 * - 2024-12-05: Fixed export references and imports to match actual implementation
 */

import { describe, it, expect, vi } from '../vitest-stub';

// Import the correct function names from the modules
import { submitCarListing } from '@/components/forms/car-listing/submission/services/submissionService';
import { prepareCarDataForSubmission } from '@/components/forms/car-listing/submission/utils/dataPreparation';
import { validateCarData } from '@/components/forms/car-listing/submission/utils/validationHandler';
import { calculateReservePrice } from '@/components/forms/car-listing/submission/utils/reservePriceCalculator';
import { cleanupStorage } from '@/components/forms/car-listing/submission/utils/storageCleanup';

// Mock the dependencies
vi.mock('@/components/forms/car-listing/submission/utils/dataPreparation');
vi.mock('@/components/forms/car-listing/submission/utils/validationHandler');
vi.mock('@/components/forms/car-listing/submission/utils/reservePriceCalculator');
vi.mock('@/components/forms/car-listing/submission/utils/storageCleanup');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => ({ data: { id: 'mock-car-id' }, error: null })
        })
      })
    }),
    storage: {
      from: () => ({
        list: () => ({ data: [], error: null }),
        copy: () => ({ data: {}, error: null })
      })
    }
  }
}));

describe('Form Submission Integration', () => {
  it('should process form submission successfully', async () => {
    // Setup mocks
    const mockFormData = {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      // ... other required fields
    };
    
    const mockPreparedData = {
      ...mockFormData,
      price: 15000,
      features: { satNav: true, panoramicRoof: false, heatedSeats: true, reverseCamera: true, upgradedSound: false }
    };
    
    const mockReservePrice = 10000;
    
    // Mock implementation of utility functions
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ isValid: true, errors: [] });
    vi.mocked(calculateReservePrice).mockReturnValue(mockReservePrice);
    vi.mocked(cleanupStorage).mockResolvedValue(undefined);
    
    // Execute the test using the corrected function name
    const result = await submitCarListing(mockFormData as any, 'user-123');
    
    // Assertions
    expect(result.success).toBe(true);
    expect(result.carId).toBeDefined(); // Using carId property
    expect(prepareCarDataForSubmission).toHaveBeenCalledWith(mockFormData);
    expect(validateCarData).toHaveBeenCalledWith(mockPreparedData);
    expect(calculateReservePrice).toHaveBeenCalledWith(mockPreparedData.price);
    expect(cleanupStorage).toHaveBeenCalled();
  });
  
  it('should handle validation errors', async () => {
    // Setup mocks
    const mockFormData = {
      make: 'Toyota',
      // Missing required fields
    };
    
    const mockPreparedData = { ...mockFormData };
    
    // Mock implementation with validation errors
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ 
      isValid: false, 
      errors: ['Missing required field: model', 'Missing required field: year'] 
    });
    
    // Execute the test with the corrected function name
    const result = await submitCarListing(mockFormData as any, 'user-123');
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Missing required field: model', 'Missing required field: year']);
    expect(prepareCarDataForSubmission).toHaveBeenCalledWith(mockFormData);
    expect(validateCarData).toHaveBeenCalledWith(mockPreparedData);
    expect(calculateReservePrice).not.toHaveBeenCalled();
    expect(cleanupStorage).not.toHaveBeenCalled();
  });
  
  it('should handle database errors', async () => {
    // Setup mocks
    const mockFormData = {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      // ... other required fields
    };
    
    const mockPreparedData = { ...mockFormData };
    
    // Mock implementation
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ isValid: true, errors: [] });
    
    // Mock database error
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => ({ data: null, error: new Error('Database error') })
            })
          })
        }),
        storage: {
          from: () => ({
            list: () => ({ data: [], error: null }),
            copy: () => ({ data: {}, error: null })
          })
        }
      }
    }));
    
    // Execute the test with the corrected function name
    const result = await submitCarListing(mockFormData as any, 'user-123');
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Database error');
    expect(prepareCarDataForSubmission).toHaveBeenCalledWith(mockFormData);
    expect(validateCarData).toHaveBeenCalledWith(mockPreparedData);
  });
  
  it('should handle storage errors', async () => {
    // Setup mocks
    const mockFormData = {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      uploadedPhotos: ['temp/photo1.jpg', 'temp/photo2.jpg'],
      // ... other required fields
    };
    
    const mockPreparedData = { ...mockFormData };
    
    // Mock implementation
    vi.mocked(prepareCarDataForSubmission).mockReturnValue(mockPreparedData);
    vi.mocked(validateCarData).mockReturnValue({ isValid: true, errors: [] });
    
    // Mock storage error
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => ({ data: { id: 'mock-car-id' }, error: null })
            })
          })
        }),
        storage: {
          from: () => ({
            list: () => ({ data: [], error: null }),
            copy: () => ({ data: null, error: new Error('Storage error') })
          })
        }
      }
    }));
    
    // Execute the test with the corrected function name
    const result = await submitCarListing(mockFormData as any, 'user-123');
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Storage error');
    expect(prepareCarDataForSubmission).toHaveBeenCalledWith(mockFormData);
    expect(validateCarData).toHaveBeenCalledWith(mockPreparedData);
  });
});
