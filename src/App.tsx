
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of app routing
 * - 2024-03-19: Added authentication provider
 * - 2024-03-19: Implemented toast notifications 
 * - 2024-03-19: Removed Partners route
 * - 2024-07-06: Added password reset routes
 * - 2024-09-08: Fixed Index component import to resolve module resolution issue
 * - 2024-10-20: Fixed React Query import to use @tanstack/react-query instead of react-query
 * - 2024-10-20: Fixed RealtimeProvider import path
 * - 2024-10-21: Removed redundant QueryClientProvider since it's already in main.tsx
 * - 2024-12-15: Fixed NavigationDiagnostics placement to be inside Router component 
 * - 2027-07-24: Added diagnostics page route
 * - 2027-07-28: Removed diagnostic components
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <TransactionProvider>
            <RealtimeProvider>
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
            </RealtimeProvider>
          </TransactionProvider>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
