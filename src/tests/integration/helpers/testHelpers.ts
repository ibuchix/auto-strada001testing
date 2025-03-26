
/**
 * Created: 2025-08-15
 * Common test helpers for integration tests
 */

import { vi } from '../../vitest-stub';
import { supabase } from '@/integrations/supabase/client';

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

// Create mockable data for tests
export const createMockFormData = (overrides = {}) => ({
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  uploadedPhotos: ['temp/photo1.jpg', 'temp/photo2.jpg'],
  ...overrides
});

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
