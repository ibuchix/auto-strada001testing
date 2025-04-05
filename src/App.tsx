
/**
 * App component with centralized error handling
 * Updated: 2025-04-05 - Fixed ErrorBoundary usage
 */

import { Routes, Route } from "react-router-dom";
import IndexPage from "@/pages/Index";
import Auth from "@/pages/Auth";
import Sellers from "@/pages/Sellers";
import Dealers from "@/pages/Dealers";
import SellerDashboard from "@/pages/SellerDashboard";
import DealerDashboard from "@/pages/DealerDashboard";
import HowItWorks from "@/pages/HowItWorks";
import SellMyCar from "@/pages/SellMyCar";
import FAQ from "@/pages/FAQ";
import DealerSignup from "@/pages/DealerSignup";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ManualValuation from "@/pages/ManualValuation";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { ResetPassword } from "@/components/auth/ResetPassword";
import { UpdatePassword } from "@/components/auth/UpdatePassword";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import { TransactionProvider } from "./components/transaction/TransactionProvider";
import SellerRegistrationRepairPage from "./pages/SellerRegistrationRepair";
import DiagnosticsPage from "./pages/DiagnosticsPage";
import { ErrorProvider } from './errors/context';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { AppError } from './errors/classes';

// Custom fallback component for the ErrorBoundary
const ErrorFallback = (error: AppError, resetError: () => void) => (
  <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
    <h2 className="text-xl font-bold text-red-800 mb-2">An error occurred</h2>
    <p className="text-gray-600 mb-4">{error.message}</p>
    <button 
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Try again
    </button>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <ErrorProvider>
        <AuthProvider>
          <TransactionProvider>
            <Routes>
              <Route path="/" element={<IndexPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/sellers" element={<Sellers />} />
              <Route path="/dealers" element={<Dealers />} />
              <Route path="/dashboard/seller" element={<SellerDashboard />} />
              <Route path="/dashboard/dealer" element={<DealerDashboard />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/sell-my-car" element={<SellMyCar />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/dealer-signup" element={<DealerSignup />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/manual-valuation" element={<ManualValuation />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/update-password" element={<UpdatePassword />} />
              <Route path="/seller-registration-repair" element={<SellerRegistrationRepairPage />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
            </Routes>
            <Toaster />
          </TransactionProvider>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;
