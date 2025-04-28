
/**
 * Hook to handle VIN lookup operations
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - 2025-04-06: Enhanced error handling and user feedback
 * - 2025-04-07: Improved data storage and validation
 * - 2025-04-07: Added structured result data for better integration
 * - 2025-04-28: Fixed TypeScript typing issues between different VehicleData interfaces
 */
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { validateVin, VehicleData as ValidationVehicleData, isValidVinFormat } from "@/services/supabase/valuation/vinValidationService";
import { getVehicleData, storeVehicleData, VehicleData as StorageVehicleData } from "@/services/vehicleDataService";

export const useVinLookup = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storedVehicleData, setStoredVehicleData] = useState<StorageVehicleData | null>(() => {
    // Initialize with any existing vehicle data
    return getVehicleData();
  });
  
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
    handleVinLookup
  };
};
