
/**
 * Changes made:
 * - 2028-11-14: Created types file to centralize extended form types
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

/**
 * Extended form return type with custom methods for the car listing form
 */
export interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData?: () => void;
  handleReset?: () => void;
}
