
/**
 * Changes made:
 * - 2025-06-14: Removed DealerSignup, Dealers, DealerDashboard, About, Contact, Sellers, SellMyCar, and Terms pages and their routes
 * - 2025-05-25: Implemented proper routing setup with BrowserRouter
 * - 2025-06-22: Removed BrowserRouter as it's now in main.tsx
 * - 2025-06-22: Confirmed all deleted pages and their routes removed
 * - 2025-06-22: Removed /dashboard/car/:carId route (CarDetailsPage)
 * - 2025-06-22: Restored SellMyCar page and route to support post-valuation listing flow
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { clearStaleLocalStorage } from './config/storage';
import IndexPage from './pages/Index';
import { lazy, Suspense } from 'react';

// Lazy load all pages for better performance
const FAQPage = lazy(() => import('./pages/FAQ'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorks'));
const ManualValuationPage = lazy(() => import('./pages/ManualValuation'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const SellerRegistrationRepairPage = lazy(() => import('./pages/SellerRegistrationRepair'));
const AuthPage = lazy(() => import('./pages/Auth'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboard'));
// Removed: const CarDetailsPage = lazy(() => import('./pages/CarDetails'));
const SellMyCarPage = lazy(() => import('./pages/SellMyCar'));

// Only import the diagnostic page in development mode
const DiagnosticsPage = import.meta.env.DEV 
  ? lazy(() => import('./pages/Diagnostics'))
  : () => null;

function App() {
  useEffect(() => {
    // Clear any stale local storage references on app initialization
    clearStaleLocalStorage();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/faq" element={
          <Suspense fallback={<div>Loading...</div>}>
            <FAQPage />
          </Suspense>
        } />
        <Route path="/how-it-works" element={
          <Suspense fallback={<div>Loading...</div>}>
            <HowItWorksPage />
          </Suspense>
        } />
        <Route path="/manual-valuation" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ManualValuationPage />
          </Suspense>
        } />
        <Route path="/privacy" element={
          <Suspense fallback={<div>Loading...</div>}>
            <PrivacyPage />
          </Suspense>
        } />
        <Route path="/seller-registration-repair" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellerRegistrationRepairPage />
          </Suspense>
        } />
        <Route path="/auth" element={
          <Suspense fallback={<div>Loading...</div>}>
            <AuthPage />
          </Suspense>
        } />
        <Route path="/dashboard/seller" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellerDashboardPage />
          </Suspense>
        } />
        <Route path="/sell-my-car" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellMyCarPage />
          </Suspense>
        } />
        {/* Removed: <Route path="/dashboard/car/:carId" element={<Suspense>...</Suspense>} /> */}
        {import.meta.env.DEV && (
          <Route 
            path="/diagnostics" 
            element={
              <Suspense fallback={<div>Loading diagnostics...</div>}>
                <DiagnosticsPage />
              </Suspense>
            } 
          />
        )}
        {/* 404 page for any unmatched routes */}
        <Route path="*" element={
          <Suspense fallback={<div>Loading...</div>}>
            <NotFoundPage />
          </Suspense>
        } />
      </Routes>
    </>
  );
}

export default App;
