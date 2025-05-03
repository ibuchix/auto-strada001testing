
/**
 * PersonalDetailsSection component
 * Created: 2025-07-18
 * Updated: 2025-05-05 - Fixed type incompatibility with address field
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CarListingFormData } from '@/types/forms';

export const PersonalDetailsSection = () => {
  const { register, formState: { errors } } = useFormContext<CarListingFormData>();
  
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seller_name">Name</Label>
          <Input 
            id="seller_name"
            {...register('seller_name')}
            placeholder="Your full name" 
          />
          {errors.seller_name && (
            <p className="text-red-500 text-sm">{errors.seller_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input 
            id="mobileNumber"
            {...register('mobileNumber')}
            placeholder="Your mobile number" 
          />
          {errors.mobileNumber && (
            <p className="text-red-500 text-sm">{errors.mobileNumber.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea 
          id="address"
          {...register('address')}
          placeholder="Your address"
          defaultValue=""
        />
        {errors.address && (
          <p className="text-red-500 text-sm">{errors.address.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sellerNotes">Additional Notes</Label>
        <Textarea 
          id="sellerNotes"
          {...register('sellerNotes')}
          placeholder="Any additional information you'd like to share"
          rows={4}
        />
        {errors.sellerNotes && (
          <p className="text-red-500 text-sm">{errors.sellerNotes.message}</p>
        )}
      </div>
    </div>
  );
};
