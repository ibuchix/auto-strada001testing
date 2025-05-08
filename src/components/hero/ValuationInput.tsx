
/**
 * ValuationInput Component
 * Created: 2025-05-24 - Added to ensure ValuationForm renders properly
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ValuationInputProps {
  form: UseFormReturn<any>;
}

const ValuationInput = ({ form }: ValuationInputProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="vin" className="text-sm font-medium text-gray-700 block mb-1">
          Vehicle Identification Number (VIN)
        </label>
        <Input
          id="vin"
          type="text"
          placeholder="Enter VIN number"
          {...form.register('vin')}
          className="w-full"
        />
        {form.formState.errors.vin && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.vin.message?.toString()}</p>
        )}
      </div>

      <div>
        <label htmlFor="mileage" className="text-sm font-medium text-gray-700 block mb-1">
          Mileage
        </label>
        <Input
          id="mileage"
          type="number"
          placeholder="Enter vehicle mileage"
          {...form.register('mileage')}
          className="w-full"
        />
        {form.formState.errors.mileage && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.mileage.message?.toString()}</p>
        )}
      </div>

      <div>
        <label htmlFor="gearbox" className="text-sm font-medium text-gray-700 block mb-1">
          Transmission
        </label>
        <Select
          defaultValue={form.getValues('gearbox') || 'manual'}
          onValueChange={(value) => form.setValue('gearbox', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.gearbox && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.gearbox.message?.toString()}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        Get Valuation
      </Button>
    </div>
  );
};

export default ValuationInput;
