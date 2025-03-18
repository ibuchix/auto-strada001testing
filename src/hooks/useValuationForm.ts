
/**
 * Changes made:
 * - 2024-10-28: Created useValuationForm hook to handle valuation form state and submission
 * - 2024-10-29: Fixed supabase import and added context parameter
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransaction } from "@/hooks/useTransaction";
import { TransactionType } from "@/services/supabase/transactionService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

// Define the form schema for validation
const valuationFormSchema = z.object({
  vin: z.string().min(11, "VIN must be at least 11 characters long").max(17),
  mileage: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Mileage must be a positive number",
  }),
  gearbox: z.enum(["manual", "automatic"])
});

export type ValuationFormData = z.infer<typeof valuationFormSchema>;

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const { session } = useAuth();
  
  // Setup form with validation
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "automatic"
    }
  });

  // Use transaction service for reliable API calls
  const { executeTransaction } = useTransaction();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(async (data) => {
      setIsLoading(true);
      
      try {
        // Execute valuation request using transaction service for reliability
        const result = await executeTransaction(
          "Get Vehicle Valuation",
          TransactionType.OTHER,
          async () => {
            const { data: valuation, error } = await supabase.functions.invoke('handle-seller-operations', {
              body: {
                operation: 'validate_vin',
                vin: data.vin,
                mileage: Number(data.mileage),
                gearbox: data.gearbox,
                userId: session?.user?.id
              }
            });
            
            if (error) throw error;
            if (!valuation.success) {
              throw new Error(valuation.error || "Failed to validate VIN");
            }
            
            return valuation.data;
          }
        );

        if (result) {
          if (result.isExisting) {
            toast.error("This vehicle has already been listed");
            return;
          }

          // Store valuation data and VIN details in localStorage
          localStorage.setItem('valuationData', JSON.stringify(result));
          localStorage.setItem('tempVIN', data.vin);
          localStorage.setItem('tempMileage', data.mileage);
          localStorage.setItem('tempGearbox', data.gearbox);
          
          // Update state and show dialog
          setValuationResult(result);
          setShowDialog(true);
        }
      } catch (error: any) {
        console.error('Valuation error:', error);
        toast.error(error.message || "Failed to get vehicle valuation");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
    context
  };
};
