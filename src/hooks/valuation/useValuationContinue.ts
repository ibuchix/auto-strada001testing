
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export const useValuationContinue = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const isLoggedIn = !!session;

  const handleContinue = (carData: any) => {
    console.log('Continue button clicked with data:', carData);

    if (!isLoggedIn) {
      toast.info("Please sign in to continue", {
        description: "Create an account or sign in to list your car",
        duration: 5000
      });
      navigate('/auth', { 
        state: { 
          redirectAfter: '/sell-my-car',
          carData
        }
      });
      return;
    }

    // Restore localStorage operations
    try {
      localStorage.setItem('valuationData', JSON.stringify(carData));
      localStorage.setItem('tempVIN', carData.vin || '');
      localStorage.setItem('tempMileage', carData.mileage?.toString() || '');
      localStorage.setItem('tempGearbox', carData.transmission || '');
      console.log('Car data stored successfully in localStorage');

      // Navigate to the sell-my-car page
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: carData
        }
      });

      toast.success("Ready to list your car", {
        description: "Please complete the listing form",
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to store car data:', error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support",
        duration: 5000
      });
    }
  };

  return { 
    handleContinue, 
    isLoggedIn 
  };
};
