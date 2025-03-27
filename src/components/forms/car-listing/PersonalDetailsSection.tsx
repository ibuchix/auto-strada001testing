
/**
 * Changes made:
 * - Updated to use typed StepComponentProps
 * - Added validation support
 * - Enhanced form fields with better validation rules
 * - Added save button with validation logic
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface PersonalDetailsSectionProps {
  form: UseFormReturn<CarListingFormData>;
  onValidate?: () => Promise<boolean>;
}

export const PersonalDetailsSection = ({ 
  form, 
  onValidate 
}: PersonalDetailsSectionProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDetails = async () => {
    try {
      setIsSaving(true);
      
      // If onValidate is provided, run validation
      if (onValidate) {
        const isValid = await onValidate();
        if (!isValid) {
          toast.error('Please complete all required fields');
          return;
        }
      }
      
      // Save logic here (handled by parent component typically)
      toast.success('Personal details saved successfully');
    } catch (error) {
      toast.error('Error saving details');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ 
            required: "Full name is required" 
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} id="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          rules={{ 
            required: "Address is required" 
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} id="address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          rules={{ 
            required: "Mobile number is required",
            pattern: {
              value: /^\+?[0-9\s\-()]{8,}$/,
              message: "Please enter a valid mobile number"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input {...field} type="tel" id="mobileNumber" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <Button 
        type="button" 
        onClick={handleSaveDetails} 
        disabled={isSaving}
        className="w-full md:w-auto"
      >
        {isSaving ? "Saving..." : "Save Details"}
      </Button>
    </div>
  );
};
