import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { PersonalDetailsSection } from "./car-listing/PersonalDetailsSection";
import { VehicleStatusSection } from "./car-listing/VehicleStatusSection";
import { FeaturesSection } from "./car-listing/FeaturesSection";
import { PhotoUploadSection } from "./car-listing/PhotoUploadSection";
import { ServiceHistorySection } from "./car-listing/ServiceHistorySection";
import { CarListingFormData } from "@/types/forms";

export const CarListingForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carId, setCarId] = useState<string>();
  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');

  const form = useForm<CarListingFormData>({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      isDamaged: false,
      isRegisteredInPoland: false,
      features: {
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false,
      },
      seatMaterial: "cloth",
      numberOfKeys: "1",
      hasToolPack: false,
      hasDocumentation: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      financeDocument: null,
      serviceHistoryType: "none",
    },
  });

  const onSubmit = async (data: CarListingFormData) => {
    setIsSubmitting(true);
    try {
      const { data: carData, error } = await supabase.from('cars').insert({
        ...valuationData,
        seller_id: (await supabase.auth.getUser()).data.user?.id,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        features: data.features,
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys),
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
      }).select().single();

      if (error) throw error;

      setCarId(carData.id);
      toast.success("Basic information saved. Please upload the required photos.");
    } catch (error) {
      console.error('Error listing car:', error);
      toast.error("Failed to list car. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <PersonalDetailsSection form={form} />
        <VehicleStatusSection form={form} />
        <FeaturesSection form={form} />
        <ServiceHistorySection form={form} carId={carId} />

        <div className="space-y-4">
          <Label>Additional Information</Label>
          <div className="space-y-4">
            <div className="space-y-4">
              <Label>Seat Material</Label>
              <RadioGroup
                value={form.watch("seatMaterial")}
                onValueChange={(value) => form.setValue("seatMaterial", value as CarListingFormData["seatMaterial"])}
                className="grid grid-cols-2 gap-4"
              >
                {["cloth", "leather", "half leather", "suede"].map((material) => (
                  <div key={material} className="flex items-center space-x-2">
                    <RadioGroupItem value={material} id={material} />
                    <Label htmlFor={material} className="capitalize">
                      {material}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>Number of Keys</Label>
              <RadioGroup
                value={form.watch("numberOfKeys")}
                onValueChange={(value) => form.setValue("numberOfKeys", value as "1" | "2")}
                className="grid grid-cols-2 gap-4"
              >
                {["1", "2"].map((number) => (
                  <div key={number} className="flex items-center space-x-2">
                    <RadioGroupItem value={number} id={`keys-${number}`} />
                    <Label htmlFor={`keys-${number}`}>{number} Key{number === "2" && "s"}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Finance Information</Label>
          <Input
            type="number"
            placeholder="Outstanding Finance Amount (PLN)"
            {...form.register("financeAmount")}
          />
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) form.setValue("financeDocument", file);
            }}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-secondary hover:bg-secondary/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving Information..." : carId ? "Update Information" : "Save Information"}
        </Button>

        {carId && (
          <div className="space-y-8">
            <PhotoUploadSection form={form} carId={carId} />
            
            <Button
              type="button"
              className="w-full bg-primary hover:bg-primary/90 text-white"
              onClick={() => navigate('/dashboard/seller')}
            >
              Complete Listing
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};