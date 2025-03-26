
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/Index'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const SellerFormPage = lazy(() => import('./pages/SellerFormPage'));
const LoadingPage = lazy(() => import('./pages/LoadingPage'));
const SellerRegistrationRepair = lazy(() => import('./pages/SellerRegistrationRepair'));
const SellMyCarPage = lazy(() => import('./pages/SellMyCar'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorks'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const Sellers = lazy(() => import('./pages/Sellers'));
const ManualValuation = lazy(() => import('./pages/ManualValuation'));
const DiagnosticsPage = lazy(() => import('./pages/DiagnosticsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/seller-dashboard" element={
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/seller-form" element={
          <ProtectedRoute>
            <SellerFormPage />
          </ProtectedRoute>
        } />
        <Route path="/seller/repair" element={
          <ProtectedRoute>
            <SellerRegistrationRepair />
          </ProtectedRoute>
        } />
        <Route path="/sell-my-car" element={<SellMyCarPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sellers" element={<Sellers />} />
        <Route path="/manual-valuation" element={<ManualValuation />} />
        <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
