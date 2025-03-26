
/**
 * Created: 2025-08-15
 * Common test helpers for integration tests
 * Updated: 2025-08-19: Fixed mock return types
 */

import { vi } from '../../vitest-stub';
import { CarListingFormData } from '@/types/forms';

// Mock the supabase client for tests
export const mockSupabase = () => {
  return vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => ({ data: { id: 'mock-car-id' }, error: null })
          })
        }),
        upsert: () => ({
          select: () => [{ id: 'mock-car-id' }]
        })
      }),
      storage: {
        from: () => ({
          list: () => ({ data: [], error: null }),
          copy: () => ({ data: {}, error: null })
        })
      },
      rpc: () => ({ data: { car_id: 'mock-car-id' }, error: null })
    }
  }));
};

// Create mockable data for tests with required fields
export const createMockFormData = (overrides = {}) => ({
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
  financeDocument: null,
  ...overrides
}) as CarListingFormData;

// Mock database error scenario
export const mockDatabaseError = () => {
  const dbError = new Error('Database error');
  
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => ({ data: null, error: dbError })
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
  
  return dbError;
};

// Mock storage error scenario
export const mockStorageError = () => {
  const storageError = new Error('Storage error');
  
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
          copy: () => ({ data: null, error: storageError })
        })
      }
    }
  }));
  
  return storageError;
};
