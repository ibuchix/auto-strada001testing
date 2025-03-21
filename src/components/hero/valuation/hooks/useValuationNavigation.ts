
/**
 * Changes made:
 * - 2024-11-12: Created hook to handle valuation navigation logic
 * - 2024-11-14: Enhanced session verification and error handling
 * - 2024-12-05: Improved navigation reliability with more robust checks
 * - 2025-03-21: Added comprehensive logging for navigation flow
 * - 2025-06-12: Enhanced navigation debugging with detailed error tracking
 * - 2025-07-05: Fixed direct navigation issue preventing listing process
 * - 2025-07-06: Added forced redirect via window.location.replace for maximum reliability
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { valuationService } from "@/services/supabase/valuationService";

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
        navigate('/auth');
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
      
      // Store reservation ID if present
      if (valuationData.reservationId) {
        localStorage.setItem('vinReservationId', valuationData.reservationId);
        console.log('VIN reservation ID stored:', valuationData.reservationId);
      }

      // Force store the complete valuation data in localStorage to ensure it's available
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      
      // If seller status is already verified, proceed to listing page
      if (isSeller) {
        console.log('User is verified seller, navigating to listing page');
        
        // Use forced redirect for maximum reliability
        const sellMyCarUrl = "/sell-my-car";
        console.log('Forcing navigation to:', sellMyCarUrl);
        
        // Attempt normal navigation first, then fallback to forced redirect
        try {
          navigate(sellMyCarUrl, { 
            state: { 
              fromValuation: true,
              valuationData
            },
            replace: true
          });
          
          // Set a failsafe forced navigation after a short delay
          setTimeout(() => {
            if (window.location.pathname !== sellMyCarUrl) {
              console.log('Executing failsafe forced navigation');
              window.location.replace(sellMyCarUrl);
            }
          }, 100);
        } catch (navError) {
          console.error('Navigation error:', navError);
          window.location.replace(sellMyCarUrl);
        }
        return;
      }
      
      // If seller status is unknown, proceed but inform user they'll need to complete registration
      console.log('User is not verified as seller yet, proceeding to listing page with notification');
      toast.info("Additional seller info needed", {
        description: "You'll need to complete your seller profile during the listing process."
      });
      
      // Use forced redirect for more reliable navigation
      const sellMyCarUrl = "/sell-my-car";
      console.log('Forcing navigation to:', sellMyCarUrl);
      
      try {
        navigate(sellMyCarUrl, { 
          state: { 
            fromValuation: true,
            valuationData,
            requiresSellerVerification: true
          },
          replace: true 
        });
        
        // Set a failsafe forced navigation after a short delay
        setTimeout(() => {
          if (window.location.pathname !== sellMyCarUrl) {
            console.log('Executing failsafe forced navigation');
            window.location.replace(sellMyCarUrl);
          }
        }, 100);
      } catch (navError) {
        console.error('Navigation error:', navError);
        window.location.replace(sellMyCarUrl);
      }
    } catch (error) {
      console.error('Navigation error during valuation continue:', error);
      
      // Detailed error reporting
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        session: session ? 'active' : 'none',
        userData: session?.user ? {
          id: session.user.id,
          email: session.user.email
        } : 'no user'
      });
      
      toast.error("Unable to process request", {
        description: "There was a problem listing your car. Please try again or contact support."
      });
      
      // Fallback navigation as last resort
      try {
        navigate('/sell-my-car');
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        window.location.replace('/sell-my-car');
      }
    }
  };

  return { handleContinue, isLoggedIn };
};
