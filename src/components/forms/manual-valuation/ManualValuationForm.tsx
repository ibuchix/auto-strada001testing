import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VehicleDetailsSection } from "./VehicleDetailsSection";
import { ConditionSection } from "./ConditionSection";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { ContactSection } from "./ContactSection";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ManualValuationFormData {
  vin: string;
  make: string;
  model: string;
  year: number;
  transmission: string;
  engineCapacity?: number;
  mileage: number;
  registrationNumber?: string;
  conditionRating: number;
  accidentHistory?: boolean;
  serviceHistoryStatus?: string;
  previousOwners?: number;
  lastServiceDate?: string; // Changed from Date to string
  features?: Record<string, boolean>;
  interiorMaterial?: string;
  modifications?: string;
  fuelType?: string;
  color?: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
}

export const ManualValuationForm = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ManualValuationFormData>({
    defaultValues: {
      conditionRating: 3,
      features: {},
    },
  });

  const onSubmit = async (data: ManualValuationFormData) => {
    if (!session?.user.id) {
      toast.error("Please sign in to submit a valuation request");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("manual_valuations").insert({
        user_id: session.user.id,
        vin: data.vin,
        make: data.make,
        model: data.model,
        year: data.year,
        transmission: data.transmission,
        engine_capacity: data.engineCapacity,
        mileage: data.mileage,
        registration_number: data.registrationNumber,
        condition_rating: data.conditionRating,
        accident_history: data.accidentHistory,
        service_history_status: data.serviceHistoryStatus,
        previous_owners: data.previousOwners,
        last_service_date: data.lastServiceDate, // Now passing string directly
        features: data.features,
        interior_material: data.interiorMaterial,
        modifications: data.modifications,
        fuel_type: data.fuelType,
        color: data.color,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        notes: data.notes,
      });

      if (error) throw error;

      toast.success("Valuation request submitted successfully!");
      navigate("/dashboard/seller");
    } catch (error: any) {
      console.error("Error submitting valuation:", error);
      toast.error(error.message || "Failed to submit valuation request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <VehicleDetailsSection form={form} />
        <ConditionSection form={form} />
        <PhotoUploadSection 
          form={form} 
          onProgressUpdate={setUploadProgress}
        />
        <ContactSection form={form} />

        <Button
          type="submit"
          className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit Valuation Request"
          )}
        </Button>
      </form>
    </Form>
  );
};