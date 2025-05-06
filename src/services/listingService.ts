
/**
 * Car Listing Service
 * Updated: 2025-05-04 - Enhanced error handling and added detailed logging
 * Updated: 2025-05-04 - Improved VIN reservation handling with better debug info
 * Updated: 2025-05-06 - Fixed permission denied error by using security definer function
 * Updated: 2025-05-06 - Refactored to use separate vinStatusChecker
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { verifyVinReservation, cleanupVinReservation } from "./vinReservationService/vinStatusChecker";

export const createCarListing = async (
  valuationData: any,
  userId: string,
  vin: string,
  mileage: number,
  transmission: string
) => {
  console.log('Creating car listing with data:', {
    userId,
    vin,
    mileage,
    transmission,
    valuationData
  });

  try {
    // Get the reservation ID from localStorage
    const reservationId = localStorage.getItem('vinReservationId');
    if (!reservationId) {
      console.error("No VIN reservation ID found in localStorage");
      
      // Detailed logging for debugging
      console.log("Listing Service: Missing VIN reservation", {
        vin,
        localStorageKeys: Object.keys(localStorage),
        localStorageVin: localStorage.getItem('tempVIN'),
        timestamp: new Date().toISOString()
      });
      
      throw new Error("No valid VIN reservation found. Please validate your VIN in the Vehicle Details section.");
    }
    
    console.log(`Using reservation ID: ${reservationId}`);

    // Verify the VIN reservation is valid - this handles both regular and temporary reservations
    const verificationResult = await verifyVinReservation(vin, userId);
    
    if (!verificationResult.isValid) {
      throw new Error(verificationResult.error || "Invalid VIN reservation");
    }

    // Use the dedicated create-car-listing edge function
    console.log('Calling create-car-listing edge function...');
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: {
        valuationData,
        userId,
        vin,
        mileage,
        transmission,
        reservationId
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }
    
    console.log('Edge function response:', data);
    
    if (!data?.success) {
      console.error('Edge function returned error:', data?.message || 'Unknown error');
      throw new Error(data?.message || "Failed to create listing");
    }

    // Clean up the reservation data from localStorage after successful creation
    cleanupVinReservation();

    console.log('Listing created successfully:', data);
    return data.data;
  } catch (error: any) {
    console.error('Error creating listing:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    
    toast.error('Failed to create car listing', {
      description: error.message || "An unknown error occurred"
    });
    
    throw error;
  }
};
