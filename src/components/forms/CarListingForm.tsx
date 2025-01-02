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
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const CarListingForm = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { form, isSubmitting, carId, lastSaved, onSubmit } = useCarListingForm(session?.user.id);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (data: any) => {
    try {
      console.log('Form submission started with data:', data);
      
      if (!session?.user.id) {
        toast.error("You must be logged in to submit a listing");
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

      setIsSubmitting(true);
      console.log('Attempting to save car listing...');
      const success = await onSubmit(data);
      
      if (success) {
        console.log('Car listing saved successfully with ID:', carId);
        setShowSuccessDialog(true);
      } else {
        console.error('Failed to save car listing');
        toast.error("Failed to submit listing");
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to submit listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
          {lastSaved && (
            <p className="text-sm text-subtitle italic">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </p>
          )}
          
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
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-subtitle mt-2">Upload progress: {Math.round(uploadProgress)}%</p>
                </div>
              )}
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Seller Notes</h2>
              <SellerNotesSection form={form} />
            </Card>
          </div>

          <div className="sticky bottom-0 bg-white p-4 shadow-lg rounded-t-lg border-t">
            <Button
              type="submit"
              className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-semibold py-4 text-lg rounded-md transition-all duration-200 ease-in-out"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Listing"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-oswald">
              <CheckCircle2 className="h-6 w-6 text-[#21CA6F]" />
              Listing Submitted Successfully
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="mb-4 text-base">
                Your car listing has been submitted and is pending review. Our team will review your listing within 24 hours.
              </p>
              <p className="text-sm text-subtitle">
                You will receive a notification once your listing is live.
              </p>
              <Button 
                className="mt-6 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full sm:w-auto"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate('/dashboard/seller');
                }}
              >
                Go to Dashboard
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};