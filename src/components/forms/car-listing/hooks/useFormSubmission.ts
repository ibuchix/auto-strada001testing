import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";

export const useFormSubmission = (userId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

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
      console.log('Starting submission process...');
      const valuationData = localStorage.getItem('valuationData');
      
      if (!valuationData) {
        toast.error("Vehicle valuation data not found", {
          description: "Please complete the valuation process first. You'll be redirected to start over.",
          duration: 5000,
          action: {
            label: "Start Valuation",
            onClick: () => navigate('/sellers')
          }
        });
        navigate('/sellers');
        return;
      }

      const parsedValuationData = JSON.parse(valuationData);
      console.log('Parsed valuation data:', parsedValuationData);

      // Validate required photos
      if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
        toast.error("Missing required photos", {
          description: "Please upload at least one photo of your vehicle",
          duration: 5000
        });
        return;
      }

      // First operation: Save basic data
      const basicData = {
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
        is_draft: false
      };

      console.log('Saving basic data...');
      const { data: savedBasicData, error: basicError } = await supabase
        .from('cars')
        .upsert({
          ...basicData,
          ...(carId && { id: carId })
        })
        .select()
        .single();

      if (basicError) {
        console.error('Basic data error:', basicError);
        if (basicError.code === '23505') {
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
        throw basicError;
      }

      const updatedCarId = carId || savedBasicData.id;
      console.log('Basic data saved successfully. Car ID:', updatedCarId);

      // Second operation: Save additional details
      const additionalData = {
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
        number_of_keys: parseInt(data.numberOfKeys)
      };

      console.log('Saving additional data...');
      const { error: additionalError } = await supabase
        .from('cars')
        .update(additionalData)
        .eq('id', updatedCarId)
        .single();

      if (additionalError) {
        console.error('Additional data error:', additionalError);
        toast.error("Failed to save additional details", {
          description: "Your basic information was saved. You can try updating the details later.",
          duration: 5000,
          action: {
            label: "Try Again",
            onClick: () => navigate(`/sell-my-car?draft=${updatedCarId}`)
          }
        });
        throw additionalError;
      }

      console.log('Form submission completed successfully');
      toast.success("Listing submitted successfully!", {
        description: "Your listing will be reviewed by our team.",
      });
      setShowSuccessDialog(true);
      
      // Clear valuation data after successful submission
      localStorage.removeItem('valuationData');
      localStorage.removeItem('tempMileage');
      localStorage.removeItem('tempVIN');
      localStorage.removeItem('tempGearbox');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      if (error.message?.includes('vehicle valuation')) {
        toast.error("Valuation data missing", {
          description: "Please complete the vehicle valuation process first.",
          duration: 5000,
          action: {
            label: "Start Valuation",
            onClick: () => navigate('/sellers')
          }
        });
      } else if (error.code === 'PGRST301') {
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
          duration: 5000,
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        });
      } else {
        toast.error("Failed to submit listing", {
          description: "Please check your connection and try again. If the problem persists, contact support.",
          duration: 5000,
          action: {
            label: "Contact Support",
            onClick: () => window.location.href = 'mailto:support@example.com'
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    navigate
  };
};