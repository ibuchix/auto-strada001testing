
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form handling for vehicle valuation
 * - 2024-03-19: Added error handling and success dialog management
 * - 2024-03-19: Integrated with valuation service
 * - 2024-07-20: Enhanced error handling and user feedback
 * - 2024-09-18: Added request timeout and improved error recovery
 * - 2025-10-20: Fixed form submission and improved debugging
 */

import { useState, useRef, useEffect } from "react";
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual",
    },
  });

  // Clear any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onSubmit = async (data: ValuationFormData) => {
    console.log('Starting valuation form submission:', data);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Set a timeout to cancel the operation if it takes too long
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.log('Valuation request timed out');
        setIsLoading(false);
        toast.error("Request timed out", {
          description: "The valuation request is taking longer than expected. Please try again.",
        });
      }
    }, 20000); // 20 second timeout
    
    try {
      console.log('Calling getValuation with parameters:', {
        vin: data.vin,
        mileage: parseInt(data.mileage),
        gearbox: data.gearbox
      });
      
      const result = await getValuation(
        data.vin,
        parseInt(data.mileage),
        data.gearbox
      );

      console.log('Valuation result:', result);

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (result.success) {
        // Store the valuation data in localStorage
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);

        // Log the data with price information for debugging
        console.log('Setting valuation result with data:', {
          make: result.data.make,
          model: result.data.model,
          year: result.data.year,
          valuation: result.data.valuation,
          reservePrice: result.data.reservePrice,
          averagePrice: result.data.averagePrice
        });

        setValuationResult(result.data);
        setShowDialog(true);
        
        // Reset retry count on success
        setRetryCount(0);
      } else {
        console.error('Valuation failed:', result.data?.error);
        
        // Handle specific error scenarios
        if (result.data?.error?.includes('rate limit') || 
            result.data?.error?.includes('too many requests')) {
          toast.error("Too many requests", {
            description: "Please wait a moment before trying again.",
          });
        } else if (result.data?.error === 'Request timed out') {
          // Timeout was already handled by the service
        } else {
          toast.error(result.data?.error || "Failed to get vehicle valuation", {
            description: "Please try again or contact support if the issue persists."
          });
        }
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
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
      setIsLoading(false);
    } finally {
      // Make sure isLoading is set to false in all cases
      // This might be redundant with the above setIsLoading calls but ensures it's always reset
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
