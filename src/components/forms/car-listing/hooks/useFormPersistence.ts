
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of auto-save functionality
 * - 2024-03-19: Added debounce mechanism
 * - 2024-03-19: Implemented data persistence with Supabase
 * - 2025-06-18: Added isSaving state for better UI feedback
 * - 2025-06-18: Improved debounce mechanism
 * - 2025-06-18: Enhanced error handling
 * - 2026-05-15: Refactored into smaller modules for better maintainability
 */

import { useFormPersistence as useFormPersistenceImpl } from './persistence';
export type { UseFormPersistenceResult, UseFormPersistenceProps } from './persistence/types';

// Re-export the hook with the same interface
export const useFormPersistence = useFormPersistenceImpl;
