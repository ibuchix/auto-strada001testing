
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const SellerFormPage = lazy(() => import('./pages/SellerFormPage'));
const LoadingPage = lazy(() => import('./pages/LoadingPage'));
const SellerRegistrationRepair = lazy(() => import('./pages/SellerRegistrationRepair'));

function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route 
          path="/seller-dashboard" 
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller-form" 
          element={
            <ProtectedRoute>
              <SellerFormPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller-registration-repair" 
          element={
            <ProtectedRoute>
              <SellerRegistrationRepair />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
