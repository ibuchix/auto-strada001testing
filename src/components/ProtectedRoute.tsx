
/**
 * Updated: 2024-09-08
 * Fixed export for ProtectedRoute component
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { session } = useAuth();
  
  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}

export default ProtectedRoute;
