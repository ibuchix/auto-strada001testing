
/**
 * Changes made:
 * - 2024-11-12: Created hook to handle valuation navigation logic
 * - 2024-11-14: Enhanced session verification and error handling
 * - 2024-12-05: Improved navigation reliability with more robust checks
 * - 2025-03-21: Added comprehensive logging for navigation flow
 * - 2025-06-12: Enhanced navigation debugging with detailed error tracking
 * - 2025-07-05: Fixed direct navigation issue preventing listing process
 * - 2025-07-06: Added forced redirect via window.location.replace for maximum reliability
 * - 2025-07-07: Completely refactored to ensure navigation always works regardless of cache errors
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useValuationNavigation = () => {
  const { session, isSeller } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!session;

  const handleContinue = async (
    valuationData: any,
    mileage?: number
  ) => {
    console.log('useValuationNavigation - handleContinue called:', {
      isLoggedIn: !!session,
      isSeller,
      mileage,
      hasValuationData: !!valuationData,
      makeModel: valuationData ? `${valuationData.make} ${valuationData.model}` : 'N/A',
      timestamp: new Date().toISOString()
    });

    try {
      // Check if user is logged in
      if (!session?.user) {
        console.log('User not logged in, redirecting to auth page');
        localStorage.setItem('redirectAfterAuth', '/sell-my-car');
        localStorage.setItem('pendingListingAction', 'true');
        toast.info("Please sign in first", {
          description: "Create an account or sign in to continue listing your car"
        });
        
        // Use direct navigation for maximum reliability
        try {
          navigate('/auth');
        } catch (error) {
          console.error('Navigation error, using fallback:', error);
          window.location.href = '/auth';
        }
        return;
      }

      // If mileage is provided from parameter, otherwise get from localStorage
      const carMileage = mileage || parseInt(localStorage.getItem('tempMileage') || '0');
      
      console.log('Creating car listing with valuation data:', {
        userId: session.user.id,
        vin: valuationData.vin,
        mileage: carMileage,
        transmission: valuationData.transmission || localStorage.getItem('tempGearbox')
      });
      
      // Store reservation ID if present - non-critical operation
      try {
        if (valuationData.reservationId) {
          localStorage.setItem('vinReservationId', valuationData.reservationId);
          console.log('VIN reservation ID stored:', valuationData.reservationId);
        }
      } catch (error) {
        console.log('Non-critical error storing reservation ID:', error);
        // Continue regardless of error
      }

      // Force store the complete valuation data in localStorage to ensure it's available
      try {
        localStorage.setItem('valuationData', JSON.stringify(valuationData));
      } catch (error) {
        console.error('Error storing valuation data:', error);
        // Still continue even if this fails
      }
      
      // If seller status is already verified or unknown, proceed to listing page
      console.log('Navigating to listing page with seller status:', isSeller ? 'verified' : 'unverified');
      
      // Display appropriate toast based on seller status
      if (!isSeller) {
        toast.info("Additional seller info needed", {
          description: "You'll need to complete your seller profile during the listing process."
        });
      }
      
      // GUARANTEED NAVIGATION - this must always work
      const sellMyCarUrl = "/sell-my-car";
      
      // Try multiple navigation methods in sequence for maximum reliability
      try {
        console.log('Attempting primary navigation to:', sellMyCarUrl);
        
        // First try React Router navigation
        navigate(sellMyCarUrl, { 
          state: { 
            fromValuation: true,
            valuationData,
            requiresSellerVerification: !isSeller
          },
          replace: true 
        });
        
        // Set a guaranteed fallback after a short delay in case React Router navigation failed silently
        setTimeout(() => {
          if (window.location.pathname !== sellMyCarUrl) {
            console.log('Primary navigation may have failed, executing fallback navigation');
            window.location.href = sellMyCarUrl;
            
            // Ultimate fallback after another delay
            setTimeout(() => {
              if (window.location.pathname !== sellMyCarUrl) {
                console.log('All navigation attempts may have failed, using location.replace as last resort');
                window.location.replace(sellMyCarUrl);
              }
            }, 300);
          }
        }, 100);
      } catch (navigationError) {
        // If React Router throws an error, use direct window location
        console.error('Primary navigation error, using direct location:', navigationError);
        window.location.href = sellMyCarUrl;
      }
    } catch (error) {
      // Catch any other errors in the overall process
      console.error('Critical error during navigation:', error);
      
      // Emergency fallback navigation - this must always execute
      try {
        window.location.replace('/sell-my-car');
      } catch (fallbackError) {
        console.error('Ultimate fallback navigation failed:', fallbackError);
        // There's nothing more we can do if this fails
      }
    }
  };

  return { handleContinue, isLoggedIn };
};
