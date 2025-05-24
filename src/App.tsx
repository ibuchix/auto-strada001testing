
/**
 * Changes made:
 * - 2025-05-25: Implemented proper routing setup with BrowserRouter
 * - 2025-05-25: Added IndexPage as the default route
 * - 2025-05-25: Kept storage diagnostic available only in development mode
 * - 2025-06-22: Fixed Router placement to work with AuthProvider
 * - 2025-06-22: Removed BrowserRouter as it's now in main.tsx
 * - 2025-06-22: Completely removed StorageDiagnostic from homepage
 * - 2025-06-22: Added dedicated diagnostics page only in development
 * - 2025-06-22: Added routes for all existing pages in the codebase
 * - 2025-05-24: Added car details route for seller dashboard
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { clearStaleLocalStorage } from './config/storage';
import IndexPage from './pages/Index';
import { lazy, Suspense } from 'react';

// Lazy load all pages for better performance
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));
const DealersPage = lazy(() => import('./pages/Dealers'));
const DealerSignupPage = lazy(() => import('./pages/DealerSignup'));
const FAQPage = lazy(() => import('./pages/FAQ'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorks'));
const ManualValuationPage = lazy(() => import('./pages/ManualValuation'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const SellersPage = lazy(() => import('./pages/Sellers'));
const SellerRegistrationRepairPage = lazy(() => import('./pages/SellerRegistrationRepair'));
const TermsPage = lazy(() => import('./pages/Terms'));
const AuthPage = lazy(() => import('./pages/Auth'));
const SellMyCarPage = lazy(() => import('./pages/SellMyCar'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboard'));
const CarDetailsPage = lazy(() => import('./pages/CarDetails'));

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
        {/* Main Routes */}
        <Route path="/" element={<IndexPage />} />
        <Route path="/about" element={
          <Suspense fallback={<div>Loading...</div>}>
            <AboutPage />
          </Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ContactPage />
          </Suspense>
        } />
        <Route path="/dealers" element={
          <Suspense fallback={<div>Loading...</div>}>
            <DealersPage />
          </Suspense>
        } />
        <Route path="/dealer-signup" element={
          <Suspense fallback={<div>Loading...</div>}>
            <DealerSignupPage />
          </Suspense>
        } />
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
        <Route path="/sellers" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellersPage />
          </Suspense>
        } />
        <Route path="/seller-registration-repair" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellerRegistrationRepairPage />
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<div>Loading...</div>}>
            <TermsPage />
          </Suspense>
        } />
        <Route path="/auth" element={
          <Suspense fallback={<div>Loading...</div>}>
            <AuthPage />
          </Suspense>
        } />
        <Route path="/sell-my-car" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellMyCarPage />
          </Suspense>
        } />
        <Route path="/dashboard/seller" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SellerDashboardPage />
          </Suspense>
        } />
        <Route path="/dashboard/car/:carId" element={
          <Suspense fallback={<div>Loading...</div>}>
            <CarDetailsPage />
          </Suspense>
        } />
        
        {/* Conditionally render diagnostics route only in development */}
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
