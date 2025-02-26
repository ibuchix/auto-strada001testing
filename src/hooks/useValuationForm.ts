
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form handling for vehicle valuation
 * - 2024-03-19: Added error handling and success dialog management
 * - 2024-03-19: Integrated with valuation service
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { toast } from "sonner";
import { getValuation } from "@/components/hero/valuation/services/valuationService";

export const useValuationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);

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
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);

        setValuationResult(result.data);
        setShowDialog(true);
      } else {
        console.error('Valuation failed:', result.data.error);
        toast.error(result.data.error || "Failed to get vehicle valuation");
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
