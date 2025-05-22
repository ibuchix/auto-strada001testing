
/**
 * Car Listing Service
 * Updated: 2025-05-04 - Enhanced error handling and added detailed logging
 * Updated: 2025-05-04 - Improved VIN reservation handling with better debug info
 * Updated: 2025-05-06 - Fixed permission denied error by using security definer function
 * Updated: 2025-05-06 - Refactored to use separate vinStatusChecker
 * Updated: 2025-05-17 - Added auth token passing to edge function for better permission handling
 * Updated: 2025-05-18 - Improved error handling with better diagnostics and error recovery
 * Updated: 2025-05-24 - Fixed import path for recoverVinReservation function
 * Updated: 2025-07-22 - Added schema error detection and handling with user-friendly messages
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { verifyVinReservation, cleanupVinReservation } from "./vinReservationService/vinStatusChecker";
import { recoverVinReservation, createVinReservation } from "./reservationRecoveryService";

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
    let reservationId = localStorage.getItem('vinReservationId');
    
    // If no reservation ID, attempt to recover or create one
    if (!reservationId) {
      console.warn("No VIN reservation ID found in localStorage, attempting recovery");
      
      // Detailed logging for debugging
      console.log("Listing Service: Attempting VIN reservation recovery", {
        vin,
        localStorageKeys: Object.keys(localStorage),
        localStorageVin: localStorage.getItem('tempVIN'),
        timestamp: new Date().toISOString()
      });
      
      // Attempt to recover or create a reservation
      reservationId = await recoverVinReservation(vin, userId, valuationData);
      
      if (!reservationId) {
        console.error("Failed to recover or create VIN reservation");
        throw new Error("Unable to secure a VIN reservation. Please validate your VIN in the Vehicle Details section.");
      }
      
      console.log(`Recovered/created reservation ID: ${reservationId}`);
    } else {
      console.log(`Using existing reservation ID: ${reservationId}`);
    }

    // Verify the VIN reservation is valid - this handles both regular and temporary reservations
    const verificationResult = await verifyVinReservation(vin, userId);
    
    if (!verificationResult.isValid) {
      throw new Error(verificationResult.error || "Invalid VIN reservation");
    }

    // Get the current auth session to pass the token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    // Log auth token status (not the actual token)
    console.log('Auth token available:', !!accessToken);
    
    // Additional headers to pass the auth token
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Use the dedicated create-car-listing edge function with proper auth
    console.log('Calling create-car-listing edge function with auth...');
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: {
        valuationData,
        userId,
        vin,
        mileage,
        transmission,
        reservationId
      },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    });

    if (error) {
      console.error('Edge function error:', error);
      
      // Check for specific error types
      if (error.message && error.message.includes('schema mismatch')) {
        toast.error('Database schema error', {
          description: "The system encountered a database structure issue. Please contact support."
        });
      } else {
        toast.error('Error creating listing', {
          description: error.message || 'An unknown error occurred'
        });
      }
      
      throw error;
    }
    
    console.log('Edge function response:', data);
    
    if (!data?.success) {
      console.error('Edge function returned error:', data?.message || 'Unknown error');
      
      // Handle specific error codes
      if (data?.code === 'SCHEMA_ERROR') {
        const errorDetails = data?.details || {};
        
        let friendlyMessage = "There was a problem with the data format.";
        if (errorDetails.field) {
          friendlyMessage = `There was a problem with the "${errorDetails.field}" field format.`;
        }
        
        toast.error('Data format issue', {
          description: friendlyMessage
        });
      } else {
        toast.error('Failed to create listing', {
          description: data?.message || "Unknown error"
        });
      }
      
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
      
      // Specific error handling based on error type
      if (error.message.includes('FunctionsHttpError') || error.name === 'FunctionsHttpError') {
        toast.error('Server Communication Error', {
          description: "We're having trouble reaching our servers. Please try again shortly."
        });
      } else if (error.message.includes('schema') || error.message.includes('column')) {
        toast.error('System Configuration Error', {
          description: "There's a system configuration issue. Our team has been notified."
        });
      } else {
        toast.error('Failed to create car listing', {
          description: error.message || "An unknown error occurred"
        });
      }
    } else {
      toast.error('Failed to create car listing', {
        description: "An unexpected error occurred"
      });
    }
    
    throw error;
  }
};
