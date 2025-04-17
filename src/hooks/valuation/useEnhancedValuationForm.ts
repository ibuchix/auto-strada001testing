
/**
 * Fixed Enhanced Valuation Form Hook
 * 
 * Changes:
 * - Fixed navigation to listing form to preserve state
 * - Improved state management for car data
 * - Enhanced error handling
 * - Added proper data passing between VIN check and listing form
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { useValuationStore } from "@/hooks/store/useValuationStore";
import { normalizeVIN } from "@/utils/vinValidation";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useEnhancedValuationForm = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const {
    vin,
    mileage,
    gearbox,
    isLoading,
    valuationResult,
    setVin,
    setMileage,
    setGearbox,
    handleVinSubmit,
    resetForm
  } = useValuationStore();
  
  // Setup form with validation
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: vin || "",
      mileage: mileage || "",
      gearbox: gearbox || "manual",
    },
  });
  
  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    console.log("Enhanced valuation form submitting with data:", {
      vin: form.getValues('vin'),
      mileage: form.getValues('mileage'),
      gearbox: form.getValues('gearbox')
    });
    
    // Store input in state
    setVin(form.getValues('vin'));
    setMileage(form.getValues('mileage'));
    setGearbox(form.getValues('gearbox'));
    
    // Submit the form
    handleVinSubmit(e, {
      vin: normalizeVIN(form.getValues('vin')),
      mileage: form.getValues('mileage'),
      gearbox: form.getValues('gearbox')
    });
    
    // Open dialog
    setShowDialog(true);
  };
  
  // Continue with car listing - FIXED to use React Router navigation
  const handleContinue = useCallback(() => {
    console.log("Continuing with car listing - using React Router navigation");
    
    if (valuationResult && valuationResult.data && valuationResult.data.make) {
      // Store the car data in sessionStorage to ensure it's available after navigation
      sessionStorage.setItem('carData', JSON.stringify({
        vin: valuationResult.data.vin,
        make: valuationResult.data.make,
        model: valuationResult.data.model,
        year: valuationResult.data.year,
        mileage: valuationResult.data.mileage,
        transmission: valuationResult.data.transmission || gearbox,
        valuation: valuationResult.data.valuation,
        reservePrice: valuationResult.data.reservePrice
      }));
      
      // Use React Router navigation instead of window.location
      // This preserves React state during navigation
      navigate('/sell-my-car', { 
        state: { 
          fromVinCheck: true,
          carData: {
            vin: valuationResult.data.vin,
            make: valuationResult.data.make,
            model: valuationResult.data.model,
            year: valuationResult.data.year,
            mileage: valuationResult.data.mileage,
            transmission: valuationResult.data.transmission || gearbox,
            valuation: valuationResult.data.valuation,
            reservePrice: valuationResult.data.reservePrice
          }
        }
      });
      
      // Close the dialog after navigation is triggered
      setShowDialog(false);
    } else {
      toast.error("No valid vehicle data available");
    }
  }, [valuationResult, gearbox, navigate]);
  
  // Close dialog
  const handleClose = useCallback(() => {
    console.log("Closing valuation dialog");
    setShowDialog(false);
    setErrorDialogOpen(false);
  }, []);
  
  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    errorDialogOpen,
    setErrorDialogOpen,
    valuationResult,
    onSubmit,
    handleContinue,
    handleClose,
    resetForm
  };
};
