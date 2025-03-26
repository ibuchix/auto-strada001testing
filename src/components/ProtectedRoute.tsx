
/**
 * Created: 2024-08-20
 * A route component that protects content behind authentication
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoadingPage } from '../pages/LoadingPage';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSeller?: boolean;
}

export const ProtectedRoute = ({ children, requireSeller = false }: ProtectedRouteProps) => {
  const { session, isSeller, isLoading } = useAuth();
  
  // Show loading state while authentication status is being determined
  if (isLoading) {
    return <LoadingPage />;
  }
  
  // If not logged in, redirect to auth page
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  // If seller access is required but user is not a seller
  if (requireSeller && !isSeller) {
    return <Navigate to="/auth" replace />;
  }
  
  // User is authenticated (and is a seller if required)
  return <>{children}</>;
};
