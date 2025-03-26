
/**
 * Created: 2025-08-15
 * Mock utilities for integration tests
 */

import { vi } from '../../vitest-stub';

// Setup utilities mocks for all tests
export const setupUtilityMocks = () => {
  // Mock the submission utilities
  vi.mock('@/components/forms/car-listing/submission/utils/dataPreparation', () => ({
    prepareCarDataForSubmission: vi.fn()
  }));
  
  vi.mock('@/components/forms/car-listing/submission/utils/validationHandler', () => ({
    validateCarData: vi.fn(),
    validateVinData: vi.fn(),
    validateValuationData: vi.fn(),
    validateMileageData: vi.fn()
  }));
  
  vi.mock('@/components/forms/car-listing/submission/utils/reservePriceCalculator', () => ({
    calculateReservePrice: vi.fn()
  }));
  
  vi.mock('@/components/forms/car-listing/submission/utils/storageCleanup', () => ({
    cleanupStorage: vi.fn(),
    cleanupFormStorage: vi.fn()
  }));
  
  return {
    prepareCarDataForSubmission: vi.fn(),
    validateCarData: vi.fn(),
    calculateReservePrice: vi.fn(),
    cleanupStorage: vi.fn(),
    validateValuationData: vi.fn(),
    validateMileageData: vi.fn(),
    cleanupFormStorage: vi.fn()
  };
};

// Reset all mocks between tests
export const resetAllMocks = () => {
  vi.resetAllMocks();
};
