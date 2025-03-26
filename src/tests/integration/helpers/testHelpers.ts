
/**
 * Test helpers for integration tests
 * Changes made:
 * - 2025-12-12: Fixed mock function implementations
 */

import { vi } from '../../vitest-stub';
import { CarListingFormData } from '@/types/forms';

export const mockLocalStorage = () => {
  // Use single argument method
  vi.mock('localStorage');
  
  // Mock local storage implementation
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => Object.keys(store).forEach(key => delete store[key])
  };
};

// Create mock form data for tests
export const createMockFormData = (): CarListingFormData => {
  return {
    make: 'Test Make',
    model: 'Test Model',
    year: 2023,
    vin: 'TEST12345678901234',
    mileage: 10000,
    engineCapacity: 2000,
    transmission: 'manual',
    bodyType: 'sedan',
    numberOfDoors: '4',
    seatMaterial: 'cloth',
    numberOfKeys: '2',
    price: '25000',
    previousOwners: 1,
    accidentHistory: 'none',
    isDamaged: false,
    isRegisteredInPoland: true,
    isSellingOnBehalf: false,
    hasPrivatePlate: false,
    serviceHistoryType: 'full',
    conditionRating: 4,
    features: {
      satNav: true,
      panoramicRoof: false,
      reverseCamera: true,
      heatedSeats: true,
      upgradedSound: false
    },
    uploadedPhotos: ['test-photo-1.jpg', 'test-photo-2.jpg'],
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
    rimPhotosComplete: true,
    financeDocument: null,
    serviceHistoryFiles: []
  };
};

// Mock valuation data in local storage
export const setupMockValuationData = () => {
  // Use single argument method
  vi.mock('localStorage');
  
  const valuationData = {
    make: 'Test Make',
    model: 'Test Model',
    year: 2023,
    vin: 'TEST12345678901234',
    valuation: 25000,
    averagePrice: 27000,
    transmission: 'manual'
  };
  
  localStorage.setItem('valuationData', JSON.stringify(valuationData));
  localStorage.setItem('tempMileage', '10000');
  
  return valuationData;
};

// Use single argument method  
export const mockStorageService = () => {
  vi.mock('@/services/storageService');
  
  return {
    uploadPhoto: vi.fn().mockResolvedValue({
      path: 'test-photo-path',
      success: true
    }),
    uploadDocument: vi.fn().mockResolvedValue({
      path: 'test-document-path',
      success: true
    })
  };
};
