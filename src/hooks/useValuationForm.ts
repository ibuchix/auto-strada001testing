
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form handling for vehicle valuation
 * - 2024-03-19: Added error handling and success dialog management
 * - 2024-03-19: Integrated with valuation service
 * - 2024-07-20: Enhanced error handling and user feedback
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { toast } from "sonner";
import { getValuation, cleanupValuationData } from "@/components/hero/valuation/services/valuationService";

export const useValuationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual",
    },
  });

  const onSubmit = async (data: ValuationFormData) => {
    console.log('Starting valuation form submission:', data);
    setIsLoading(true);
    
    try {
      const result = await getValuation(
        data.vin,
        parseInt(data.mileage),
        data.gearbox
      );

      console.log('Valuation result:', result);

      if (result.success) {
        // Store the valuation data in localStorage
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);

        setValuationResult(result.data);
        setShowDialog(true);
        
        // Reset retry count on success
        setRetryCount(0);
      } else {
        console.error('Valuation failed:', result.data.error);
        
        // Handle specific error scenarios
        if (result.data.error?.includes('rate limit') || 
            result.data.error?.includes('too many requests')) {
          toast.error("Too many requests", {
            description: "Please wait a moment before trying again.",
          });
        } else if (result.data.error === 'Request timed out') {
          // Timeout was already handled by the service
        } else {
          toast.error(result.data.error || "Failed to get vehicle valuation", {
            description: "Please try again or contact support if the issue persists."
          });
        }
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // After 3 retries, offer manual valuation option
      if (retryCount >= 2) {
        toast.error("Valuation service unavailable", {
          description: "We're having trouble connecting to our valuation service. Would you like to try manual valuation?",
          action: {
            label: "Try Manual",
            onClick: () => {
              cleanupValuationData();
              window.location.href = '/manual-valuation';
            }
          }
        });
      } else {
        toast.error(error.message || "Failed to get vehicle valuation", {
          description: "Please check your connection and try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setValuationResult(null);
    setShowDialog(false);
    cleanupValuationData();
  };

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit: form.handleSubmit(onSubmit),
    resetForm,
  };
};
