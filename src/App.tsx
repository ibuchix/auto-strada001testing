/**
 * Changes made:
 * - 2024-03-19: Initial implementation of app routing
 * - 2024-03-19: Added authentication provider
 * - 2024-03-19: Implemented toast notifications 
 * - 2024-03-19: Removed Partners route
 * - 2024-07-06: Added password reset routes
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
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
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
