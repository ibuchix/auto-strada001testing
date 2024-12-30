import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface SellerNotesSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const SellerNotesSection = ({ form }: SellerNotesSectionProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="sellerNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-semibold">Seller Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any additional information about your vehicle that buyers should know (condition, unique features, history, etc.)"
                className="h-32 resize-none"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};