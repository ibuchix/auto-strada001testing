
/**
 * Form Helper Hooks
 * Updated: 2025-05-24 - Updated field names to use camelCase consistently for frontend
 * Updated: 2025-05-25 - Fixed field naming consistency issues
 * Updated: 2025-05-26 - Fixed DEFAULT_VALUES object for consistent camelCase usage
 * Updated: 2025-05-29 - REMOVED price field - using only reservePrice
 * Updated: 2025-06-16 - imported TransmissionType and ServiceHistoryType, used it to assert default values for transmission and serviceHistory 
 * values in getInitialFormValues and getFormDefaults
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { CarListingFormData, ServiceHistoryType, TransmissionType } from "@/types/forms";
import { validateCarOwnership } from '@/utils/carOwnershipUtils';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Export a function to get initial form values
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  return {
    ...DEFAULT_VALUES,
    // Ensure proper typing for enum values
    transmission: DEFAULT_VALUES.transmission as TransmissionType,
    serviceHistoryType: DEFAULT_VALUES.serviceHistoryType as ServiceHistoryType
  };
};

// Function to get form defaults with default values
export const getFormDefaults = (): Partial<CarListingFormData> => {
  return {
    isSellingOnBehalf: false,
    hasServiceHistory: false,
    hasPrivatePlate: false,
    hasOutstandingFinance: false,
    isDamaged: false,
    make: "",
    model: "",
    year: new Date().getFullYear(),
    mileage: 0,
    vin: "",
    reservePrice: 0,
    transmission: "manual" as TransmissionType,
    features: {
      airConditioning: false,
      bluetooth: false,
      cruiseControl: false,
      leatherSeats: false,
      navigation: false,
      parkingSensors: false,
      sunroof: false,
      satNav: false,
      panoramicRoof: false,
      reverseCamera: false,
      heatedSeats: false,
      upgradedSound: false,
      alloyWheels: false,
      keylessEntry: false,
      adaptiveCruiseControl: false,
      laneDepartureWarning: false
    },
    sellerId: "",
    serviceHistoryType: "none" as ServiceHistoryType,
    fromValuation: false
  };
};

/**
 * Hook for car listing form helpers with ownership validation
 */
export function useFormOwnershipHelpers() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  /**
   * Validates ownership of a car listing
   * @param carId The car ID to validate
   * @param redirectOnFailure Whether to redirect to dashboard if validation fails
   */
  const validateOwnership = async (carId: string, redirectOnFailure = true): Promise<boolean> => {
    try {
      if (!session?.user) {
        toast.error("Authentication required", {
          description: "You must be logged in to access this listing"
        });
        if (redirectOnFailure) {
          navigate('/login');
        }
        return false;
      }
      
      if (!carId) {
        return true; // New listing, no ownership to validate
      }
      
      const { isOwner, error } = await validateCarOwnership(carId);
      
      if (!isOwner) {
        toast.error("Ownership validation failed", {
          description: error || "You don't have permission to edit this listing"
        });
        
        if (redirectOnFailure) {
          navigate('/dashboard/seller');
        }
        
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error validating ownership:", error);
      toast.error("Ownership validation error", {
        description: error.message || "Failed to validate listing ownership"
      });
      
      if (redirectOnFailure) {
        navigate('/dashboard/seller');
      }
      
      return false;
    }
  };
  
  return {
    validateOwnership
  };
}
