
/**
 * SellerNotesSection component
 * Created: 2025-07-18
 */

import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CarListingFormData } from '@/types/forms';

export const SellerNotesSection = () => {
  const { register } = useFormContext<CarListingFormData>();
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Additional Information</h3>
        <p className="text-sm text-gray-500">
          Add any additional notes or details about your vehicle that might be helpful for potential buyers
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sellerNotes">Seller Notes</Label>
        <Textarea
          id="sellerNotes"
          {...register('sellerNotes')}
          placeholder="Describe any additional details about the vehicle's history, condition, or any other relevant information..."
          rows={6}
          className="resize-y"
        />
      </div>
    </div>
  );
};
