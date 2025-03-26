
/**
 * Utilities for mocking dependencies in tests
 * Changes made:
 * - 2025-12-12: Fixed mock function implementations
 */

import { vi } from '../../vitest-stub';

// Mock transaction service and related functions
export const mockTransactionService = () => {
  // Use single argument method
  vi.mock('@/services/supabase/transactionService');
  
  return {
    createTransaction: vi.fn().mockReturnValue({
      id: 'mock-transaction-id',
      status: 'pending',
      startTime: new Date().toISOString()
    }),
    updateTransaction: vi.fn(),
    logTransaction: vi.fn()
  };
};

// Mock form validation utilities
export const mockFormValidation = () => {
  // Use single argument method
  vi.mock('@/components/forms/car-listing/utils/validation');
  
  return {
    validateFormData: vi.fn().mockReturnValue([]),
    getFormProgress: vi.fn().mockReturnValue(100)
  };
};

// Mock Supabase client
export const mockSupabaseClient = () => {
  // Use single argument method
  vi.mock('@/integrations/supabase/client');
  
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'mock-id' },
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'mock-id' },
            error: null
          })
        })
      })
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null })
      })
    }
  };
};
