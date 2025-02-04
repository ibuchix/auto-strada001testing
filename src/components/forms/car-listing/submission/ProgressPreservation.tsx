import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useAuth } from "@/components/AuthProvider";
import { useFormPersistence } from "../hooks/useFormPersistence";

export const ProgressPreservation = () => {
  const form = useFormContext<CarListingFormData>();
  const { session } = useAuth();

  useFormPersistence(form, session?.user.id);

  return null;
};