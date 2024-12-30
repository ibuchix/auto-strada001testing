import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PersonalDetailsSection } from "./car-listing/PersonalDetailsSection";
import { VehicleStatusSection } from "./car-listing/VehicleStatusSection";
import { FeaturesSection } from "./car-listing/FeaturesSection";
import { PhotoUploadSection } from "./car-listing/PhotoUploadSection";
import { ServiceHistorySection } from "./car-listing/ServiceHistorySection";
import { AdditionalInfoSection } from "./car-listing/AdditionalInfoSection";
import { SellerNotesSection } from "./car-listing/SellerNotesSection";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { toast } from "sonner";

export const CarListingForm = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { form, isSubmitting, carId, lastSaved, onSubmit } = useCarListingForm(session?.user.id);

  const handleSubmit = async (data: any) => {
    // Validate title and description lengths
    if (data.title && data.title.length > 100) {
      toast.error("Title must be 100 characters or less");
      return;
    }

    if (data.description && data.description.length > 2000) {
      toast.error("Description must be 2000 characters or less");
      return;
    }

    // Proceed with form submission
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {lastSaved && (
          <p className="text-sm text-muted-foreground">
            Last saved: {new Date(lastSaved).toLocaleTimeString()}
          </p>
        )}
        
        <PersonalDetailsSection form={form} />
        <VehicleStatusSection form={form} />
        <FeaturesSection form={form} />
        <ServiceHistorySection form={form} carId={carId} />
        <AdditionalInfoSection form={form} />
        <SellerNotesSection form={form} />

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
