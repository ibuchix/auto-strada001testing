import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, RouteObject } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-handling/ErrorBoundary";
import { AuthProvider } from "@/components/AuthProvider";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { SellerRoute } from "@/components/SellerRoute";
import { DealerRoute } from "@/components/DealerRoute";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import SellerDashboard from "@/pages/SellerDashboard";
import DealerDashboard from "@/pages/DealerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import SellMyCar from "@/pages/SellMyCar";
import CarDetails from "@/pages/CarDetails";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import AboutUs from "@/pages/AboutUs";
import ContactUs from "@/pages/ContactUs";
import FAQ from "@/pages/FAQ";
import CarAuction from "@/pages/CarAuction";
import CarListing from "@/pages/CarListing";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import AccountSettings from "@/pages/AccountSettings";
import Notifications from "@/pages/Notifications";
import AdminListings from "@/pages/admin/AdminListings";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAuctions from "@/pages/admin/AdminAuctions";
import AdminVerifications from "@/pages/admin/AdminVerifications";
import DealerRegistration from "@/pages/DealerRegistration";
import SellerRegistration from "@/pages/SellerRegistration";
import DealerVerification from "@/pages/DealerVerification";
import SellerVerification from "@/pages/SellerVerification";
import DealerProfile from "@/pages/DealerProfile";
import SellerProfile from "@/pages/SellerProfile";
import DealerListings from "@/pages/DealerListings";
import SellerListings from "@/pages/SellerListings";
import DealerAuctions from "@/pages/DealerAuctions";
import SellerAuctions from "@/pages/SellerAuctions";
import DealerBids from "@/pages/DealerBids";
import SellerBids from "@/pages/SellerBids";
import DealerPayments from "@/pages/DealerPayments";
import SellerPayments from "@/pages/SellerPayments";
import DealerSettings from "@/pages/DealerSettings";
import SellerSettings from "@/pages/SellerSettings";
import DealerNotifications from "@/pages/DealerNotifications";
import SellerNotifications from "@/pages/SellerNotifications";
import DealerReports from "@/pages/DealerReports";
import SellerReports from "@/pages/SellerReports";
import DealerSupport from "@/pages/DealerSupport";
import SellerSupport from "@/pages/SellerSupport";
import DealerHelp from "@/pages/DealerHelp";
import SellerHelp from "@/pages/SellerHelp";
import DealerFAQ from "@/pages/DealerFAQ";
import SellerFAQ from "@/pages/SellerFAQ";
import DealerTerms from "@/pages/DealerTerms";
import SellerTerms from "@/pages/SellerTerms";
import DealerPrivacy from "@/pages/DealerPrivacy";
import SellerPrivacy from "@/pages/SellerPrivacy";
import DealerCookies from "@/pages/DealerCookies";
import SellerCookies from "@/pages/SellerCookies";
import DealerAbout from "@/pages/DealerAbout";
import SellerAbout from "@/pages/SellerAbout";
import DealerContact from "@/pages/DealerContact";
import SellerContact from "@/pages/SellerContact";
import DealerRegister from "@/pages/DealerRegister";
import SellerRegister from "@/pages/SellerRegister";
import DealerLogin from "@/pages/DealerLogin";
import SellerLogin from "@/pages/SellerLogin";
import DealerForgotPassword from "@/pages/DealerForgotPassword";
import SellerForgotPassword from "@/pages/SellerForgotPassword";
import DealerResetPassword from "@/pages/DealerResetPassword";
import SellerResetPassword from "@/pages/SellerResetPassword";
import DealerVerifyEmail from "@/pages/DealerVerifyEmail";
import SellerVerifyEmail from "@/pages/SellerVerifyEmail";
import DealerAccountSettings from "@/pages/DealerAccountSettings";
import SellerAccountSettings from "@/pages/SellerAccountSettings";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
        <ErrorBoundary>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <RealtimeProvider>
                <RouterProvider router={router} />
                <OfflineIndicator />
                <Toaster />
              </RealtimeProvider>
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </div>
  );
}

// Existing routes
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/seller",
    element: (
      <SellerRoute>
        <SellerDashboard />
      </SellerRoute>
    ),
  },
  {
    path: "/dashboard/dealer",
    element: (
      <DealerRoute>
        <DealerDashboard />
      </DealerRoute>
    ),
  },
  {
    path: "/dashboard/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/sell-my-car",
    element: (
      <SellerRoute>
        <SellMyCar />
      </SellerRoute>
    ),
  },
  {
    path: "/dashboard/car/:id",
    element: (
      <ProtectedRoute>
        <CarDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfService />,
  },
  {
    path: "/cookie-policy",
    element: <CookiePolicy />,
  },
  {
    path: "/about-us",
    element: <AboutUs />,
  },
  {
    path: "/contact-us",
    element: <ContactUs />,
  },
  {
    path: "/faq",
    element: <FAQ />,
  },
  {
    path: "/car-auction/:id",
    element: <CarAuction />,
  },
  {
    path: "/car-listing/:id",
    element: <CarListing />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
  },
  {
    path: "/account-settings",
    element: (
      <ProtectedRoute>
        <AccountSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <Notifications />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/listings",
    element: (
      <AdminRoute>
        <AdminListings />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AdminRoute>
        <AdminUsers />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <AdminRoute>
        <AdminSettings />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/reports",
    element: (
      <AdminRoute>
        <AdminReports />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/auctions",
    element: (
      <AdminRoute>
        <AdminAuctions />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/verifications",
    element: (
      <AdminRoute>
        <AdminVerifications />
      </AdminRoute>
    ),
  },
  {
    path: "/dealer-registration",
    element: <DealerRegistration />,
  },
  {
    path: "/seller-registration",
    element: <SellerRegistration />,
  },
  {
    path: "/dealer-verification",
    element: (
      <DealerRoute>
        <DealerVerification />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-verification",
    element: (
      <SellerRoute>
        <SellerVerification />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-profile",
    element: (
      <DealerRoute>
        <DealerProfile />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-profile",
    element: (
      <SellerRoute>
        <SellerProfile />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-listings",
    element: (
      <DealerRoute>
        <DealerListings />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-listings",
    element: (
      <SellerRoute>
        <SellerListings />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-auctions",
    element: (
      <DealerRoute>
        <DealerAuctions />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-auctions",
    element: (
      <SellerRoute>
        <SellerAuctions />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-bids",
    element: (
      <DealerRoute>
        <DealerBids />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-bids",
    element: (
      <SellerRoute>
        <SellerBids />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-payments",
    element: (
      <DealerRoute>
        <DealerPayments />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-payments",
    element: (
      <SellerRoute>
        <SellerPayments />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-settings",
    element: (
      <DealerRoute>
        <DealerSettings />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-settings",
    element: (
      <SellerRoute>
        <SellerSettings />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-notifications",
    element: (
      <DealerRoute>
        <DealerNotifications />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-notifications",
    element: (
      <SellerRoute>
        <SellerNotifications />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-reports",
    element: (
      <DealerRoute>
        <DealerReports />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-reports",
    element: (
      <SellerRoute>
        <SellerReports />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-support",
    element: (
      <DealerRoute>
        <DealerSupport />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-support",
    element: (
      <SellerRoute>
        <SellerSupport />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-help",
    element: (
      <DealerRoute>
        <DealerHelp />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-help",
    element: (
      <SellerRoute>
        <SellerHelp />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-faq",
    element: (
      <DealerRoute>
        <DealerFAQ />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-faq",
    element: (
      <SellerRoute>
        <SellerFAQ />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-terms",
    element: (
      <DealerRoute>
        <DealerTerms />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-terms",
    element: (
      <SellerRoute>
        <SellerTerms />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-privacy",
    element: (
      <DealerRoute>
        <DealerPrivacy />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-privacy",
    element: (
      <SellerRoute>
        <SellerPrivacy />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-cookies",
    element: (
      <DealerRoute>
        <DealerCookies />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-cookies",
    element: (
      <SellerRoute>
        <SellerCookies />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-about",
    element: (
      <DealerRoute>
        <DealerAbout />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-about",
    element: (
      <SellerRoute>
        <SellerAbout />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-contact",
    element: (
      <DealerRoute>
        <DealerContact />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-contact",
    element: (
      <SellerRoute>
        <SellerContact />
      </SellerRoute>
    ),
  },
  {
    path: "/dealer-register",
    element: <DealerRegister />,
  },
  {
    path: "/seller-register",
    element: <SellerRegister />,
  },
  {
    path: "/dealer-login",
    element: <DealerLogin />,
  },
  {
    path: "/seller-login",
    element: <SellerLogin />,
  },
  {
    path: "/dealer-forgot-password",
    element: <DealerForgotPassword />,
  },
  {
    path: "/seller-forgot-password",
    element: <SellerForgotPassword />,
  },
  {
    path: "/dealer-reset-password",
    element: <DealerResetPassword />,
  },
  {
    path: "/seller-reset-password",
    element: <SellerResetPassword />,
  },
  {
    path: "/dealer-verify-email",
    element: <DealerVerifyEmail />,
  },
  {
    path: "/seller-verify-email",
    element: <SellerVerifyEmail />,
  },
  {
    path: "/dealer-account-settings",
    element: (
      <DealerRoute>
        <DealerAccountSettings />
      </DealerRoute>
    ),
  },
  {
    path: "/seller-account-settings",
    element: (
      <SellerRoute>
        <SellerAccountSettings />
      </SellerRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

// Create a router
const router = createBrowserRouter(routes);

export default App;
