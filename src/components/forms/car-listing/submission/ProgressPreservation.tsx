
/**
 * Changes made:
 * - 2024-06-07: Created ProgressPreservation component to handle form persistence
 * - 2024-08-08: Updated to save current step along with form data
 */

import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useAuth } from "@/components/AuthProvider";
import { useFormPersistence } from "../hooks/useFormPersistence";

interface ProgressPreservationProps {
  currentStep?: number;
}

export const ProgressPreservation = ({ currentStep = 0 }: ProgressPreservationProps) => {
  const form = useFormContext<CarListingFormData>();
  const { session } = useAuth();

  useFormPersistence(form, session?.user.id, currentStep);

  return null;
};
