
/**
 * Changes made:
 * - 2025-05-08: Streamlined imports to focus on seller-side functionality
 * - 2025-05-08: Removed non-existent page imports causing build errors
 * - 2025-05-08: Simplified routes to maintain essential application flow
 * - 2025-05-08: Fixed router structure to prevent duplicate router error
 */

import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, RouteObject } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Pages currently available in the codebase
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SellerDashboard from "@/pages/SellerDashboard";
import SellMyCar from "@/pages/SellMyCar";
import CarDetails from "@/pages/CarDetails";
import NotFound from "@/pages/NotFound";

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
        <RouterProvider router={router} />
        <OfflineIndicator />
        <Toaster />
      </ThemeProvider>
    </div>
  );
}

// Simplified routes focused on seller functionality
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <SellMyCar />,
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
  // Catch-all route for any unmatched paths
  {
    path: "*",
    element: <NotFound />,
  },
];

// Create a router with the defined routes
const router = createBrowserRouter(routes);

export default App;
