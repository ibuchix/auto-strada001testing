
/**
 * Features Section Component
 * Created: 2025-06-20 - Added initial implementation
 * Updated: 2025-05-04 - Fixed CarFeatures type issues
 */

import { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "../context/FormDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CarFeatures } from '@/types/forms';

export const FeaturesSection = () => {
  const { form } = useFormData();
  
  // Create default features with all required properties
  const defaultFeatures: CarFeatures = {
    airConditioning: false,
    bluetooth: false,
    cruiseControl: false,
    leatherSeats: false,
    navigation: false,
    parkingSensors: false,
    sunroof: false,
    alloyWheels: false,
    heatedSeats: false,
    reverseCamera: false,
    satNav: false,
    panoramicRoof: false,
    upgradedSound: false,
    keylessEntry: false,
    adaptiveCruiseControl: false,
    laneDepartureWarning: false
  };
  
  // Initialize features with defaults if not already set
  if (!form.watch('features')) {
    form.setValue('features', defaultFeatures);
  }
  
  const features = form.watch('features') || defaultFeatures;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Features</CardTitle>
        <CardDescription>Select all features that apply to this vehicle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="airConditioning" 
              checked={features.airConditioning}
              onCheckedChange={(checked) => form.setValue('features.airConditioning', !!checked)}
            />
            <Label htmlFor="airConditioning">Air Conditioning</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="bluetooth" 
              checked={features.bluetooth}
              onCheckedChange={(checked) => form.setValue('features.bluetooth', !!checked)}
            />
            <Label htmlFor="bluetooth">Bluetooth</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="cruiseControl" 
              checked={features.cruiseControl}
              onCheckedChange={(checked) => form.setValue('features.cruiseControl', !!checked)}
            />
            <Label htmlFor="cruiseControl">Cruise Control</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="leatherSeats" 
              checked={features.leatherSeats}
              onCheckedChange={(checked) => form.setValue('features.leatherSeats', !!checked)}
            />
            <Label htmlFor="leatherSeats">Leather Seats</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="navigation" 
              checked={features.navigation}
              onCheckedChange={(checked) => form.setValue('features.navigation', !!checked)}
            />
            <Label htmlFor="navigation">Navigation</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="parkingSensors" 
              checked={features.parkingSensors}
              onCheckedChange={(checked) => form.setValue('features.parkingSensors', !!checked)}
            />
            <Label htmlFor="parkingSensors">Parking Sensors</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sunroof" 
              checked={features.sunroof}
              onCheckedChange={(checked) => form.setValue('features.sunroof', !!checked)}
            />
            <Label htmlFor="sunroof">Sunroof</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="alloyWheels" 
              checked={features.alloyWheels}
              onCheckedChange={(checked) => form.setValue('features.alloyWheels', !!checked)}
            />
            <Label htmlFor="alloyWheels">Alloy Wheels</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="heatedSeats" 
              checked={features.heatedSeats}
              onCheckedChange={(checked) => form.setValue('features.heatedSeats', !!checked)}
            />
            <Label htmlFor="heatedSeats">Heated Seats</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="reverseCamera" 
              checked={features.reverseCamera}
              onCheckedChange={(checked) => form.setValue('features.reverseCamera', !!checked)}
            />
            <Label htmlFor="reverseCamera">Reverse Camera</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="satNav" 
              checked={features.satNav}
              onCheckedChange={(checked) => form.setValue('features.satNav', !!checked)}
            />
            <Label htmlFor="satNav">Satellite Navigation</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="panoramicRoof" 
              checked={features.panoramicRoof}
              onCheckedChange={(checked) => form.setValue('features.panoramicRoof', !!checked)}
            />
            <Label htmlFor="panoramicRoof">Panoramic Roof</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="upgradedSound" 
              checked={features.upgradedSound}
              onCheckedChange={(checked) => form.setValue('features.upgradedSound', !!checked)}
            />
            <Label htmlFor="upgradedSound">Premium Sound System</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
