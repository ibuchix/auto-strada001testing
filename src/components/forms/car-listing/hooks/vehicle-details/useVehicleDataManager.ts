
/**
 * Hook to centralize vehicle data management and improve performance
 * 
 * Changes made:
 * - 2025-04-07: Created to consolidate vehicle data handling logic
 * - 2025-04-07: Added optimized loading and state management
 * - 2025-04-07: Implemented memoization to prevent expensive re-renders
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { 
  getVehicleData, 
  hasCompleteVehicleData,
  applyVehicleDataToForm,
  clearVehicleData
} from "@/services/vehicleDataService";

export interface UseVehicleDataManagerReturn {
  storedVehicleData: ReturnType<typeof getVehicleData>;
  isLoadingVehicleData: boolean;
  isApplyingVehicleData: boolean;
  hasVehicleData: boolean;
  applyVehicleDataToForm: () => Promise<boolean>;
  clearVehicleData: () => void;
}

export const useVehicleDataManager = (
  form: UseFormReturn<CarListingFormData>
): UseVehicleDataManagerReturn => {
  const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false);
  const [isApplyingVehicleData, setIsApplyingVehicleData] = useState(false);
  
  // Memoize vehicle data to prevent unnecessary re-renders
  const storedVehicleData = useMemo(() => getVehicleData(), []);
  const hasVehicleData = useMemo(() => hasCompleteVehicleData(), []);
  
  // Function to apply vehicle data to form with proper loading states
  const applyVehicleDataToFormWithState = useCallback(async (): Promise<boolean> => {
    if (!hasVehicleData) {
      toast.warning("No complete vehicle data found");
      return false;
    }
    
    setIsApplyingVehicleData(true);
    
    try {
      const result = applyVehicleDataToForm(form, true);
      return result;
    } catch (error) {
      console.error("Error applying vehicle data to form:", error);
      toast.error("Failed to apply vehicle data");
      return false;
    } finally {
      setIsApplyingVehicleData(false);
    }
  }, [form, hasVehicleData]);
  
  // Wrapper for clearVehicleData
  const clearVehicleDataWrapper = useCallback(() => {
    clearVehicleData();
    toast.success("Vehicle data cleared");
  }, []);
  
  return {
    storedVehicleData,
    isLoadingVehicleData,
    isApplyingVehicleData,
    hasVehicleData,
    applyVehicleDataToForm: applyVehicleDataToFormWithState,
    clearVehicleData: clearVehicleDataWrapper
  };
};
