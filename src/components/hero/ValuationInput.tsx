
/**
 * Changes made:
 * - 2025-04-29: Removed FormProvider wrapper to prevent nested form issue
 * - 2025-04-30: Refactored to accept form from parent and fix type issues
 * - 2025-05-02: Ensured mileage is handled as string type
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the type to match what useValuationForm returns
interface ValuationFormData {
  vin?: string;
  mileage?: string;
  gearbox?: 'manual' | 'automatic';
}

interface ValuationInputProps {
  form: UseFormReturn<ValuationFormData>;
}

const ValuationInput = ({ form }: ValuationInputProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div>
          <Input 
            {...form.register('vin')}
            placeholder="Enter your VIN"
            className="h-12 bg-white"
            maxLength={17}
          />
          {form.formState.errors.vin && (
            <p className="text-red-500 text-sm mt-1">Valid VIN required (17 characters)</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input 
              {...form.register('mileage')}
              placeholder="Mileage" 
              className="h-12 bg-white"
              type="number"
            />
            {form.formState.errors.mileage && (
              <p className="text-red-500 text-sm mt-1">Mileage required</p>
            )}
          </div>
          
          <div>
            <Select 
              defaultValue="manual"
              onValueChange={(value) => form.setValue('gearbox', value as 'manual' | 'automatic')}
            >
              <SelectTrigger className="h-12 bg-white">
                <SelectValue placeholder="Gearbox" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gearbox && (
              <p className="text-red-500 text-sm mt-1">Please select gearbox type</p>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="h-12 w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
        >
          Get Valuation
        </Button>
      </div>
    </div>
  );
};

export default ValuationInput;
