import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculateChecksum } from "@/utils/validation";

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
    setIsLoading(true);
    try {
      const apiId = "AUTOSTRA";
      const apiSecret = "A4FTFH54C3E37P2D34A16A7A4V41XKBF";
      const checksum = calculateChecksum(apiId, apiSecret, data.vin);

      const response = await fetch(
        `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${data.vin}/odometer:${data.mileage}/currency:PLN`
      );

      if (!response.ok) {
        throw new Error("Failed to get valuation");
      }

      const result = await response.json();

      // Store valuation data
      localStorage.setItem("valuationData", JSON.stringify(result));
      localStorage.setItem("tempMileage", data.mileage);
      localStorage.setItem("tempVIN", data.vin);
      localStorage.setItem("tempGearbox", data.gearbox);

      setValuationResult(result);
      setShowDialog(true);
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