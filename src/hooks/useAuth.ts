
/**
 * Hook for accessing authentication context
 * Created: 2025-12-12
 */

import { useContext } from 'react';
import { AuthContext } from '@/components/AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
