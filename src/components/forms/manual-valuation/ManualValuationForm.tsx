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
import { FeaturesSection } from "../car-listing/FeaturesSection";
import { ServiceHistorySection } from "../car-listing/ServiceHistorySection";
import { AdditionalInfoSection } from "../car-listing/AdditionalInfoSection";
import { SellerNotesSection } from "../car-listing/SellerNotesSection";
import { VehicleStatusSection } from "../car-listing/VehicleStatusSection";
import { CarListingFormData } from "@/types/forms";

export const ManualValuationForm = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<CarListingFormData>({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      conditionRating: 3,
      features: {
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false
      },
      isDamaged: false,
      isRegisteredInPoland: false,
      hasToolPack: false,
      hasDocumentation: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      financeDocument: null,
      serviceHistoryType: "none",
      sellerNotes: "",
      uploadedPhotos: [],
      seatMaterial: "cloth",
      numberOfKeys: "1",
      transmission: "manual"
    },
  });

  const onSubmit = async (data: CarListingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("manual_valuations").insert({
        user_id: session?.user.id,
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
        last_service_date: data.lastServiceDate,
        features: data.features,
        interior_material: data.interiorMaterial,
        modifications: data.modifications,
        fuel_type: data.fuelType,
        color: data.color,
        contact_email: data.contactEmail,
        contact_phone: data.mobileNumber,
        notes: data.notes,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys),
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
        service_history_files: data.serviceHistoryFiles,
        seller_notes: data.sellerNotes,
        name: data.name,
        address: data.address,
        mobile_number: data.mobileNumber,
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
        <VehicleStatusSection form={form} />
        <ConditionSection form={form} />
        <FeaturesSection form={form} />
        <ServiceHistorySection form={form} />
        <AdditionalInfoSection form={form} />
        <PhotoUploadSection 
          form={form} 
          onProgressUpdate={setUploadProgress}
        />
        <SellerNotesSection form={form} />
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