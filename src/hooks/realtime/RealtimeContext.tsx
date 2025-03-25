
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted context from RealtimeProvider.tsx
 */

import { createContext, useContext } from 'react';
import { RealtimeContextType } from './types';

export const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
