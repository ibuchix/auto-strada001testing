
/**
 * FeaturesSection component
 * Created: 2025-07-18
 * Updated: 2025-07-27 - Fixed type errors with features object
 */

import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CarListingFormData, CarFeatures } from '@/types/forms';
import { DEFAULT_VALUES } from '../constants/defaultValues';

export const FeaturesSection = () => {
  const { setValue, watch } = useFormContext<CarListingFormData>();
  const features = watch('features') || DEFAULT_VALUES.features;
  
  const handleFeatureChange = (feature: keyof CarFeatures, checked: boolean) => {
    setValue('features', { 
      ...features, 
      [feature]: checked 
    }, { shouldDirty: true });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Vehicle Features</h3>
        <p className="text-sm text-gray-500">
          Select all features that apply to your vehicle
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.airConditioning" 
            checked={features.airConditioning || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('airConditioning', checked === true)}
          />
          <Label htmlFor="features.airConditioning">Air Conditioning</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.bluetooth" 
            checked={features.bluetooth || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('bluetooth', checked === true)}
          />
          <Label htmlFor="features.bluetooth">Bluetooth</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.cruiseControl" 
            checked={features.cruiseControl || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('cruiseControl', checked === true)}
          />
          <Label htmlFor="features.cruiseControl">Cruise Control</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.leatherSeats" 
            checked={features.leatherSeats || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('leatherSeats', checked === true)}
          />
          <Label htmlFor="features.leatherSeats">Leather Seats</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.navigation" 
            checked={features.navigation || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('navigation', checked === true)}
          />
          <Label htmlFor="features.navigation">Navigation System</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.parkingSensors" 
            checked={features.parkingSensors || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('parkingSensors', checked === true)}
          />
          <Label htmlFor="features.parkingSensors">Parking Sensors</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.sunroof" 
            checked={features.sunroof || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('sunroof', checked === true)}
          />
          <Label htmlFor="features.sunroof">Sunroof</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.alloyWheels" 
            checked={features.alloyWheels || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('alloyWheels', checked === true)}
          />
          <Label htmlFor="features.alloyWheels">Alloy Wheels</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.heatedSeats" 
            checked={features.heatedSeats || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('heatedSeats', checked === true)}
          />
          <Label htmlFor="features.heatedSeats">Heated Seats</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="features.reverseCamera" 
            checked={features.reverseCamera || false}
            onCheckedChange={(checked) => 
              handleFeatureChange('reverseCamera', checked === true)}
          />
          <Label htmlFor="features.reverseCamera">Reverse Camera</Label>
        </div>
      </div>
    </div>
  );
};
