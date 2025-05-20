
/**
 * SellerNotesSection Component
 * Updated: 2025-05-22 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useFormData } from "./context/FormDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SellerNotesSectionProps {
  title?: string;
  subtitle?: string;
}

export const SellerNotesSection = ({ 
  title = "Seller Notes",
  subtitle = "Additional information for potential buyers"
}: SellerNotesSectionProps) => {
  const { form } = useFormData();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="sellerNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes that might be helpful for potential buyers..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Describe any relevant details about the vehicle's history, condition, or special features.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
