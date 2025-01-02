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
    try {
      console.log('Form submission started with data:', data);
      
      if (!session?.user.id) {
        toast.error("You must be logged in to save car information");
        return;
      }

      if (data.title && data.title.length > 100) {
        toast.error("Title must be 100 characters or less");
        return;
      }

      if (data.description && data.description.length > 2000) {
        toast.error("Description must be 2000 characters or less");
        return;
      }

      const requiredFields = {
        name: data.name,
        address: data.address,
        mobileNumber: data.mobileNumber,
        serviceHistoryType: data.serviceHistoryType,
        seatMaterial: data.seatMaterial,
        numberOfKeys: data.numberOfKeys,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      console.log('Attempting to save car information...');
      const success = await onSubmit(data);
      
      if (success) {
        console.log('Car information saved successfully with ID:', carId);
        toast.success("Information saved successfully");
        navigate('/dashboard/seller');
      } else {
        console.error('Failed to save car information - no success response');
        toast.error("Failed to save information");
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to save information");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {lastSaved && (
          <p className="text-sm text-muted-foreground">
            Last saved: {new Date(lastSaved).toLocaleTimeString()}
          </p>
        )}
        
        <div className="space-y-8">
          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Personal Details</h2>
            <PersonalDetailsSection form={form} />
          </div>

          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Vehicle Status</h2>
            <VehicleStatusSection form={form} />
          </div>

          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Features</h2>
            <FeaturesSection form={form} />
          </div>

          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Service History</h2>
            <ServiceHistorySection form={form} carId={carId} />
          </div>

          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Additional Information</h2>
            <AdditionalInfoSection form={form} />
          </div>

          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Photos</h2>
            <PhotoUploadSection form={form} carId={carId} />
          </div>

          <div className="rounded-lg border p-6 space-y-6">
            <h2 className="text-xl font-semibold">Seller Notes</h2>
            <SellerNotesSection form={form} />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Submit Listing"}
        </Button>
      </form>
    </Form>
  );
};