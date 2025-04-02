
/**
 * Changes made:
 * - Added ExtendedFormReturn type definition for consistency
 * - Added proper type for loadInitialData and handleReset methods
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Define ExtendedFormReturn for consistent usage across components
export interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData: () => void;
  handleReset: () => void;
}

// Add other type definitions as needed
export interface StepConfig {
  id: string;
  validate?: (data: CarListingFormData) => boolean;
}
