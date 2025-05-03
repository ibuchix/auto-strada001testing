
/**
 * SellerDetailsSection component
 * Created: 2025-07-18
 */

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CarListingFormData } from '@/types/forms';

export const SellerDetailsSection = () => {
  const { register, setValue, watch } = useFormContext<CarListingFormData>();
  const isSellingOnBehalf = watch('isSellingOnBehalf');
  
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
