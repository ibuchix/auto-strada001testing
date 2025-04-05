
/**
 * Hook to handle VIN lookup operations
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - 2025-04-06: Enhanced error handling and user feedback
 * - 2025-04-06: Added better type safety for form values
 * - 2025-04-06: Improved debugging with detailed console logs
 */
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { validateVin, VehicleData } from "@/services/supabase/valuation/vinValidationService";
import { isValidVinFormat } from "@/services/supabase/valuation/vinValidationService";
import { getVehicleData } from "@/services/vehicleDataService";

export const useVinLookup = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storedVehicleData, setStoredVehicleData] = useState<VehicleData | null>(() => {
    // Initialize with any existing vehicle data
    return getVehicleData();
  });
  
  const handleVinLookup = async (vin: string) => {
    // First validate the VIN format
    if (!isValidVinFormat(vin)) {
      toast.error("Invalid VIN format", {
        description: "Please enter a valid 17-character VIN"
      });
      return;
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
        return;
      }
      
      console.log('VIN validation successful:', response.data);
      
      // Store the fresh vehicle data
      const vehicleData = response.data;
      setStoredVehicleData(vehicleData);
      
      // Show success notification
      toast.success("VIN validation successful", {
        description: `${vehicleData.year || ''} ${vehicleData.make || ''} ${vehicleData.model || ''}`.trim()
      });
      
      // Set the VIN in the form
      form.setValue("vin", vin);
      
      // Return the data for immediate use if needed
      return vehicleData;
    } catch (error) {
      console.error('Unexpected error during VIN lookup:', error);
      toast.error("VIN lookup failed", {
        description: "An unexpected error occurred. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    storedVehicleData,
    handleVinLookup
  };
};
