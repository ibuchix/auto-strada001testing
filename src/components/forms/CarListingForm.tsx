import { useNavigate } from "react-router-dom";
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
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { UploadProgress } from "./car-listing/UploadProgress";
import { LastSaved } from "./car-listing/LastSaved";

export const CarListingForm = () => {
  const { session } = useAuth();
  const { form, isSubmitting, carId, lastSaved, onSubmit } = useCarListingForm(session?.user.id);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      if (!session?.user.id) {
        toast.error("You must be logged in to submit a listing");
        navigate("/auth");
        return;
      }

      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation) {
        toast.error("Please complete the vehicle valuation first");
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

      const uploadedPhotos = form.getValues('uploadedPhotos') || [];
      if (uploadedPhotos.length === 0) {
        toast.error("Please upload at least one photo");
        return;
      }

      const success = await onSubmit(data);
      
      if (success) {
        setShowSuccessDialog(true);
      } else {
        toast.error("Failed to submit listing");
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to submit listing");
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
          <LastSaved timestamp={lastSaved ? new Date(lastSaved) : null} />
          
          <div className="space-y-6">
            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Personal Details</h2>
              <PersonalDetailsSection form={form} />
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Vehicle Status</h2>
              <VehicleStatusSection form={form} />
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Features</h2>
              <FeaturesSection form={form} />
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Service History</h2>
              <ServiceHistorySection form={form} carId={carId} />
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Additional Information</h2>
              <AdditionalInfoSection form={form} />
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Photos</h2>
              <PhotoUploadSection 
                form={form} 
                carId={carId} 
                onProgressUpdate={setUploadProgress}
              />
              <UploadProgress progress={uploadProgress} />
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Seller Notes</h2>
              <SellerNotesSection form={form} />
            </Card>
          </div>

          <FormSubmitButton isSubmitting={isSubmitting} />
        </form>
      </Form>

      <SuccessDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog}
      />
    </>
  );
};