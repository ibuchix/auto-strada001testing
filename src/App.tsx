
/**
 * Changes made:
 * - 2025-05-08: Streamlined imports to focus on seller-side functionality
 * - 2025-05-08: Removed non-existent page imports causing build errors
 * - 2025-05-08: Simplified routes to maintain essential application flow
 * - 2025-05-08: Fixed router structure to prevent duplicate router error
 * - 2025-05-08: Added AuthProvider to wrap RouterProvider for authentication context
 * - 2025-05-19: Restored all missing routes including authentication pages
 * - 2025-05-20: Fixed root route to use IndexPage instead of SellMyCar
 * - 2025-05-21: Updated IndexPage import and ensure it's properly rendered at root path
 */

import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, RouteObject } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/AuthProvider";

// Pages currently available in the codebase
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SellerDashboard from "@/pages/SellerDashboard";
import SellMyCar from "@/pages/SellMyCar";
import CarDetails from "@/pages/CarDetails";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Sellers from "@/pages/Sellers";
import HowItWorks from "@/pages/HowItWorks";
import IndexPage from "@/pages/Index";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="App">
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <RouterProvider router={router} />
          <OfflineIndicator />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

// Comprehensive routes for the seller application
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <IndexPage />,
  },
  {
    path: "/dashboard/seller",
    element: <SellerDashboard />,
  },
  {
    path: "/sell-my-car",
    element: <SellMyCar />,
  },
  {
    path: "/dashboard/car/:id",
    element: <CarDetails />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/faq",
    element: <FAQ />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/sellers",
    element: <Sellers />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
  },
  // Catch-all route for any unmatched paths
  {
    path: "*",
    element: <NotFound />,
  },
];

// Create a router with the defined routes
const router = createBrowserRouter(routes);

export default App;
