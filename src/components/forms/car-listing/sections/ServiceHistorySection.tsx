
/**
 * Service History Section
 * Created: 2025-06-07
 * Contains fields for vehicle service history
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 */

import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export const ServiceHistorySection = () => {
  const { form } = useFormData();
  const [uploading, setUploading] = useState(false);
  
  if (!form) {
    return <div>Loading form...</div>;
  }
  
  const hasServiceHistory = form.watch("hasServiceHistory");
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="hasServiceHistory"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Do you have the service history for this vehicle?
              </FormLabel>
              <FormDescription>
                Check this if you have any service records for your vehicle
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
      
      {hasServiceHistory && (
        <div className="space-y-6 pl-8 border-l-2 border-gray-200">
          <FormField
            control={form.control}
            name="serviceHistoryType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>What type of service history do you have?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="full" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Full Service History
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="partial" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Partial Service History
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="none" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        No Documentation
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {(form.watch('serviceHistoryType') === 'full' || form.watch('serviceHistoryType') === 'partial') && (
            <div>
              <Label>Upload Service History Documents</Label>
              <div className="mt-2 p-4 border border-dashed rounded-md flex flex-col items-center justify-center">
                <Button type="button" variant="outline" className="mb-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
                <p className="text-sm text-muted-foreground">
                  PDF, PNG or JPG (max 5MB per file)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
