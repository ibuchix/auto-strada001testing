
/**
 * Hook to handle VIN lookup operations
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - 2025-04-06: Enhanced error handling and user feedback
 * - 2025-04-07: Improved data storage and validation
 * - 2025-04-07: Added structured result data for better integration
 * - 2025-04-28: Fixed TypeScript typing issues between different VehicleData interfaces
 * - 2025-05-04: Added VIN reservation creation after successful validation
 * - 2025-05-20: Fixed user ID retrieval to use direct Supabase session instead of localStorage
 */
import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { validateVin, VehicleData as ValidationVehicleData, isValidVinFormat } from "@/services/supabase/valuation/vinValidationService";
import { getVehicleData, storeVehicleData, VehicleData as StorageVehicleData } from "@/services/vehicleDataService";
import { reserveVin } from "@/services/vinReservationService";
import { supabase } from "@/integrations/supabase/client";

export const useVinLookup = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storedVehicleData, setStoredVehicleData] = useState<StorageVehicleData | null>(() => {
    // Initialize with any existing vehicle data
    return getVehicleData();
  });
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Check if we have a session at initialization
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data.session?.user?.id) {
          // If user ID is not in localStorage but we have a valid session, store it
          if (!localStorage.getItem('userId')) {
            localStorage.setItem('userId', data.session.user.id);
            console.log('User ID stored in localStorage from useVinLookup:', data.session.user.id);
          }
        }
      } catch (error) {
        console.error('Error checking session in useVinLookup:', error);
      } finally {
        if (mounted) {
          setSessionChecked(true);
        }
      }
    };
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  const getUserId = async (): Promise<string | null> => {
    // First try to get from localStorage for performance
    const localStorageUserId = localStorage.getItem('userId');
    if (localStorageUserId) {
      return localStorageUserId;
    }
    
    // If not in localStorage, get directly from session
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (userId) {
        // Store for future use
        localStorage.setItem('userId', userId);
        return userId;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user ID from session:', error);
      return null;
    }
  };
  
  const handleVinLookup = async (vin: string) => {
    // First validate the VIN format
    if (!isValidVinFormat(vin)) {
      toast.error("Invalid VIN format", {
        description: "Please enter a valid 17-character VIN"
      });
      return null;
    }
    
    // Get the current mileage from the form
    const mileage = form.watch("mileage") || 0;
    
    console.log(`Starting VIN lookup for: ${vin} with mileage: ${mileage}`);
    setIsLoading(true);
    
    try {
      const response = await validateVin({
        vin,
        mileage: parseInt(String(mileage), 10),
      });
      
      if (!response.success || !response.data) {
        console.error('VIN validation failed:', response.error);
        toast.error("VIN validation failed", {
          description: response.error || "We couldn't validate this VIN. Please try again or enter details manually."
        });
        return null;
      }
      
      console.log('VIN validation successful:', response.data);
      
      // Store the fresh vehicle data in our centralized service
      const vehicleData = response.data;
      
      // Make sure to store the data in our standardized format via the service
      const savedSuccessfully = storeVehicleData({
        vin: vin,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        mileage: parseInt(String(mileage), 10),
        transmission: vehicleData.transmission || "manual",
        engineCapacity: vehicleData.engineCapacity,
        valuation: vehicleData.valuation,
        reservePrice: vehicleData.reservePrice,
        averagePrice: vehicleData.averagePrice,
        cached: vehicleData.cached || false
      });
      
      if (!savedSuccessfully) {
        console.warn('Failed to store vehicle data');
      }
      
      // Update local state
      setStoredVehicleData(vehicleData as StorageVehicleData);
      
      // Show success notification
      toast.success("VIN validation successful", {
        description: `${vehicleData.year || ''} ${vehicleData.make || ''} ${vehicleData.model || ''}`.trim()
      });
      
      // Set the VIN in the form
      form.setValue("vin", vin);
      
      // Now create a VIN reservation to ensure this VIN can be used when submitting the form
      console.log('Creating VIN reservation for:', vin);
      
      // Get user ID directly from session - this is the key change to fix the issue
      const userId = await getUserId();
      
      if (!userId) {
        console.error('Cannot create VIN reservation: User ID not available from session');
        toast.error("Cannot reserve VIN", {
          description: "User authentication issue. Please make sure you're logged in and refresh the page."
        });
        return vehicleData;
      }
      
      console.log('Creating VIN reservation with user ID:', userId);
      
      const reservationResult = await reserveVin(vin, userId, vehicleData);
      
      if (reservationResult.success && reservationResult.data?.reservationId) {
        // Store the reservation ID in localStorage for use during form submission
        localStorage.setItem('vinReservationId', reservationResult.data.reservationId);
        console.log('VIN reservation created successfully:', reservationResult.data);
        
        toast.success("VIN reserved successfully", {
          description: "You can now submit this car listing"
        });
      } else {
        console.error('Failed to create VIN reservation:', reservationResult.error);
        toast.error("VIN reservation failed", {
          description: "Could not reserve this VIN for your listing. Please try again."
        });
      }
      
      // Return the data for immediate use if needed
      return vehicleData;
    } catch (error) {
      console.error('Unexpected error during VIN lookup:', error);
      toast.error("VIN lookup failed", {
        description: "An unexpected error occurred. Please try again later."
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    storedVehicleData,
    handleVinLookup,
    sessionChecked
  };
};
