
/**
 * Service History Section
 * Created: 2025-06-07
 * Contains fields for vehicle service history
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
            <FormMessage />
          </FormItem>
        )}
      />
      
      {hasServiceHistory && (
        <>
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
                    value={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full">Full service history</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="partial" />
                      <Label htmlFor="partial">Partial service history</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stamped" id="stamped" />
                      <Label htmlFor="stamped">Stamped service book only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="digital" id="digital" />
                      <Label htmlFor="digital">Digital service history</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="border rounded-md p-4 space-y-4">
            <h4 className="font-medium">Upload Service History Documents</h4>
            <p className="text-sm text-gray-600">
              Upload photos of your service book or service receipts to help verify the service history.
            </p>
            
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="w-full py-8 border-dashed flex flex-col items-center justify-center"
              onClick={() => {
                // This would normally trigger file upload
                setUploading(true);
                setTimeout(() => setUploading(false), 1000);
              }}
            >
              <Upload className="h-6 w-6 mb-2" />
              <span>Click to upload documents</span>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (max. 10MB)</p>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
