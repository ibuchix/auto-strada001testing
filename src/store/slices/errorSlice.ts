
/**
 * Error state slice for the central store
 * Created: 2025-04-15
 */

import { StateCreator } from 'zustand';
import { AppError } from '@/errors/classes';
import { ErrorCategory, ErrorCode } from '@/errors/types';

// Define the error state slice
export interface ErrorState {
  errors: AppError[];
  lastError: AppError | null;
}

// Define the error state actions
export interface ErrorActions {
  addError: (error: AppError) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  captureError: (error: unknown) => AppError;
}

// Combined error slice type
export type ErrorSlice = ErrorState & ErrorActions;

// Create the error slice
export const createErrorSlice: StateCreator<
  ErrorSlice,
  [["zustand/immer", never]],
  [],
  ErrorSlice
> = (set, get) => ({
  // Initial state
  errors: [],
  lastError: null,

  // Actions
  addError: (error) => set((state) => {
    state.errors = [error, ...state.errors];
    state.lastError = error;
  }),

  clearErrors: () => set((state) => {
    state.errors = [];
    state.lastError = null;
  }),

  clearError: (id) => set((state) => {
    state.errors = state.errors.filter(error => error.id !== id);
    if (state.lastError?.id === id) {
      state.lastError = null;
    }
  }),

  captureError: (errorData) => {
    let appError: AppError;
    
    if (errorData instanceof AppError) {
      appError = errorData;
    } else if (errorData instanceof Error) {
      appError = new AppError({
        message: errorData.message,
        code: ErrorCode.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN,
        metadata: {
          originalError: errorData,
          details: { stack: errorData.stack }
        }
      });
    } else {
      appError = new AppError({
        message: String(errorData || 'Unknown error'),
        code: ErrorCode.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN
      });
    }
    
    // Generate a unique ID if needed
    const errorWithId = appError.id ? appError : new AppError({
      ...appError.serialize(),
      id: crypto.randomUUID()
    });
    
    get().addError(errorWithId);
    return errorWithId;
  }
});
