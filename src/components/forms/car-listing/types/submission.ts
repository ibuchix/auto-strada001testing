import { CarListingFormData } from "@/types/forms";
import { Database } from "@/integrations/supabase/types";

export type Cars = Database["public"]["Tables"]["cars"]["Insert"];

export interface FormSubmissionResult {
  success: boolean;
  error?: string;
  data?: Cars;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CarDataTransformed extends Omit<Cars, 'features'> {
  features: {
    satNav: boolean;
    panoramicRoof: boolean;
    reverseCamera: boolean;
    heatedSeats: boolean;
    upgradedSound: boolean;
  };
}