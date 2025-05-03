
/**
 * VehicleDetailsSection component
 * Created: 2025-07-18
 */

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarListingFormData } from '@/types/forms';

export const VehicleDetailsSection = () => {
  const { register, setValue, watch } = useFormContext<CarListingFormData>();
  const transmission = watch('transmission');
  
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);
  
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input id="make" {...register('make')} placeholder="e.g. BMW" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" {...register('model')} placeholder="e.g. X5" required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select 
            value={watch('year')?.toString() || ''}
            onValueChange={(value) => setValue('year', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage</Label>
          <Input
            id="mileage"
            {...register('mileage', { valueAsNumber: true })}
            type="number"
            placeholder="e.g. 50000"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
          <Input
            id="vin"
            {...register('vin')}
            placeholder="e.g. 1HGCM82633A123456"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Select 
            value={transmission || 'manual'}
            onValueChange={(value) => setValue('transmission', value as 'manual' | 'automatic')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
