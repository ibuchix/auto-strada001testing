import { useState } from "react";
import { ValuationState, ValuationResult } from "../types";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const useValuationState = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState<TransmissionType>("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  return {
    formState: {
      vin,
      mileage,
      gearbox,
      isLoading,
      valuationResult,
      dialogOpen,
      showManualForm,
      setDialogOpen,
      setShowManualForm
    },
    setters: {
      setVin,
      setMileage,
      setGearbox,
      setIsLoading,
      setValuationResult,
      setDialogOpen,
      setShowManualForm
    }
  };
};