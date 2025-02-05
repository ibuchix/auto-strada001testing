
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { SubmissionErrorType } from "./types";

export const useFormSubmission = (userId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const handleValidationData = () => {
    const valuationData = localStorage.getItem('valuationData');
    
    if (!valuationData) {
      throw {
        message: "Vehicle valuation data not found",
        description: "Please complete the valuation process first. You'll be redirected to start over.",
        action: {
          label: "Start Valuation",
          onClick: () => navigate('/sellers')
        }
      } as SubmissionErrorType;
    }

    return JSON.parse(valuationData);
  };

  const handleSubmitToSupabase = async (data: CarListingFormData, carId?: string) => {
    const parsedValuationData = handleValidationData();

    return await supabase
      .from('cars')
      .upsert({
        id: carId,
        seller_id: userId,
        title: `${parsedValuationData.make} ${parsedValuationData.model} ${parsedValuationData.year}`,
        make: parsedValuationData.make,
        model: parsedValuationData.model,
        year: parsedValuationData.year,
        vin: parsedValuationData.vin,
        mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
        price: parsedValuationData.valuation || parsedValuationData.averagePrice,
        transmission: parsedValuationData.transmission,
        valuation_data: parsedValuationData,
        is_draft: false,
        name: data.name,
        address: data.address,
        mobile_number: data.mobileNumber,
        features: data.features,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
        seller_notes: data.sellerNotes,
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys),
        required_photos: data.uploadedPhotos
      }, {
        onConflict: 'id'
      });
  };

  const handleSubmit = async (data: CarListingFormData, carId?: string) => {
    if (!userId) {
      toast.error("Please sign in to submit a listing", {
        description: "You'll be redirected to the login page.",
        duration: 5000,
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth")
        }
      });
      navigate("/auth");
      return;
    }

    setSubmitting(true);

    try {
      const uploadingToast = toast.loading("Uploading your listing...", {
        duration: Infinity,
      });

      const { error } = await handleSubmitToSupabase(data, carId);

      toast.dismiss(uploadingToast);

      if (error) {
        console.error('Submission error:', error);
        if (error.code === '23505') {
          toast.error("This vehicle has already been listed", {
            description: "Each vehicle can only be listed once. Please try with a different VIN.",
            duration: 5000,
            action: {
              label: "Try Again",
              onClick: () => navigate('/sellers')
            }
          });
        } else {
          toast.error("Failed to save vehicle information", {
            description: "Please try again or contact support if the problem persists.",
            duration: 5000
          });
        }
        return;
      }

      toast.success("Listing submitted successfully!", {
        description: "Your listing will be reviewed by our team.",
      });
      setShowSuccessDialog(true);
      
      // Clear saved data after successful submission
      localStorage.removeItem('valuationData');
      localStorage.removeItem('tempMileage');
      localStorage.removeItem('tempVIN');
      localStorage.removeItem('tempGearbox');
      localStorage.removeItem('formProgress');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error("Failed to submit listing", {
        description: error.description || "Please check your connection and try again. If the problem persists, contact support.",
        duration: 5000,
        action: error.action || {
          label: "Contact Support",
          onClick: () => window.location.href = 'mailto:support@example.com'
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit
  };
};
