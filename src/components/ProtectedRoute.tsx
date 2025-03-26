
/**
 * Created: 2025-08-26
 * ProtectedRoute component
 */

import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'seller' | 'dealer' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requiredRole) {
    const userRole = user?.app_metadata?.role;
    if (userRole !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  return <>{children}</>;
}
