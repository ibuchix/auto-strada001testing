
/**
 * Changes made:
 * - 2025-04-29: Removed FormProvider wrapper to prevent nested form issue
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ValuationInput = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const formSchema = z.object({
    vin: z.string().min(17).max(17),
    mileage: z.string().min(1),
    gearbox: z.enum(['manual', 'automatic']),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vin: '',
      mileage: '',
      gearbox: 'manual',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

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
          onClick={handleSubmit}
        >
          Get Valuation
        </Button>
      </div>
    </div>
  );
};

export default ValuationInput;
