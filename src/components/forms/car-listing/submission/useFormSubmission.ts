
/**
 * Changes made:
 * - 2024-06-07: Refactored from hooks/useFormSubmission.ts
 * - 2024-06-07: Simplified and focused on submission logic only
 * - 2024-06-12: Further refactored to use specialized utility files
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { validateMileageData } from "./utils/validationHandler";
import { cleanupFormStorage } from "./utils/storageCleanup";
import { submitCarListing } from "./services/submissionService";
import { validateFormData } from "../utils/validation";
import { SubmissionErrorType } from "./types";

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
      // Validate mileage data first
      validateMileageData();
      
      // Validate form data
      const errors = validateFormData(data);
      if (errors.length > 0) {
        toast.error("Please complete all required fields", {
          description: "Some information is missing or incomplete.",
        });
        setSubmitting(false);
        return;
      }

      const uploadingToast = toast.loading("Uploading your listing...", {
        duration: Infinity,
      });

      // Submit the data
      await submitCarListing(data, userId, carId);

      toast.dismiss(uploadingToast);

      toast.success("Listing submitted successfully!", {
        description: "Your listing will be reviewed by our team.",
      });
      
      // Clean up storage after successful submission
      cleanupFormStorage();
      
      // Show success dialog
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || "Failed to submit listing", {
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
