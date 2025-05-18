
/**
 * SellerDetailsSection component
 * Created: 2025-07-18
 * Updated: 2025-05-15 - Added safe form context handling to prevent destructuring errors
 * Updated: 2025-05-18 - Fixed TypeScript error by using useResilientFormData instead of useSafeFormData
 */

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CarListingFormData } from '@/types/forms';
import { useResilientFormData } from '../context/FormDataContext';

export const SellerDetailsSection = () => {
  // Use a loading state to track when we're ready to render
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our safe version of form context
  const formDataContext = useResilientFormData(true);
  
  // Safely try to access form context
  let register: any;
  let setValue: any;
  let watch: any;
  
  try {
    // Try to use the form from our context first
    if (formDataContext?.form) {
      register = formDataContext.form.register;
      setValue = formDataContext.form.setValue;
      watch = formDataContext.form.watch;
      
      // If we got here, we're ready to render
      if (isLoading) setIsLoading(false);
    } 
    // If not available, try useFormContext directly
    else {
      const form = useFormContext<CarListingFormData>();
      register = form.register;
      setValue = form.setValue; 
      watch = form.watch;
      
      // If we got here, we're ready to render
      if (isLoading) setIsLoading(false);
    }
  } catch (err) {
    console.error("Error accessing form context in SellerDetailsSection:", err);
    setError(err as Error);
    setIsLoading(false);
  }
  
  // Safely watch isSellingOnBehalf with fallback value
  const isSellingOnBehalf = watch ? watch('isSellingOnBehalf') : false;
  
  // If still loading, show a loading indicator
  if (isLoading) {
    return <div className="p-4 text-center">Loading seller details form...</div>;
  }
  
  // If there was an error accessing form, show error message
  if (error || !register || !setValue || !watch) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-amber-800">
          There was an issue loading this form section. Please try refreshing the page.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="isSellingOnBehalf" 
          checked={isSellingOnBehalf || false}
          onCheckedChange={(checked) => 
            setValue('isSellingOnBehalf', checked === true)}
        />
        <div className="grid gap-1.5">
          <Label 
            htmlFor="isSellingOnBehalf" 
            className="font-normal"
          >
            I am selling this vehicle on behalf of someone else
          </Label>
          <p className="text-sm text-gray-500">
            Check this box if you are not the registered owner of the vehicle
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Your full name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input
            id="mobileNumber"
            {...register('mobileNumber')}
            placeholder="Your contact number"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="Your address"
            required
          />
        </div>
      </div>
    </div>
  );
};
