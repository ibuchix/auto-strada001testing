
/**
 * Service History Type Selector Component
 * Updated: 2025-05-22 - Updated field names to use snake_case to match database schema
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface ServiceHistoryTypeSelectorProps {
  form: UseFormReturn<CarListingFormData>;
}

export const ServiceHistoryTypeSelector = ({ form }: ServiceHistoryTypeSelectorProps) => {
  return (
    <FormField
      control={form.control}
      name="service_history_type"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Service History Type</FormLabel>
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select service history type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="full">Full Service History</SelectItem>
              <SelectItem value="partial">Partial Service History</SelectItem>
              <SelectItem value="digital">Digital Service Records</SelectItem>
              <SelectItem value="stamped">Service Book Stamps Only</SelectItem>
              <SelectItem value="none">No Service History</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
