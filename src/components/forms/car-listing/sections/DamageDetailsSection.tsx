
/**
 * Damage Details Section Component
 * Created: 2025-06-20 - Added initial implementation
 * Updated: 2025-05-04 - Fixed type issues with damage reports
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useFormData } from "../context/FormDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DamageReport, DamageType } from '@/types/forms';
import { v4 as uuidv4 } from 'uuid';

export const DamageDetailsSection = () => {
  const { form } = useFormData();
  const [damageType, setDamageType] = useState<DamageType>('scratch');
  const [damageLocation, setDamageLocation] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [damageSeverity, setDamageSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');

  // Get damage reports from form context - initialize with empty array if needed
  const damageReports = form.watch('damageReports') || [];
  
  // Also check the legacy 'damages' field to maintain compatibility
  const legacyDamages = form.watch('damages') || [];
  
  // Combine both arrays for display
  const allDamages = [...damageReports, ...legacyDamages];

  const handleAddDamage = () => {
    if (!damageDescription) {
      return; // Don't add empty damage reports
    }
    
    // Create a new damage report with a unique ID
    const newDamage: DamageReport = {
      id: uuidv4(),
      type: damageType,
      location: damageLocation,
      description: damageDescription,
      severity: damageSeverity,
      photo: null
    };
    
    // Get current reports and update form
    const currentReports = form.getValues('damageReports') || [];
    form.setValue('damageReports', [...currentReports, newDamage], { shouldValidate: true });
    
    // Reset form inputs
    setDamageDescription('');
    setDamageLocation('');
  };

  const handleRemoveDamage = (id: string) => {
    // Get current damage reports
    const currentReports = form.getValues('damageReports') || [];
    
    // Filter out the one to remove
    const updatedReports = currentReports.filter(damage => damage.id !== id);
    
    // Update form with filtered array
    form.setValue('damageReports', updatedReports, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Damage Details</CardTitle>
        <CardDescription>Add details about any damage to the vehicle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Damage Report Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="damageType">Damage Type</Label>
              <Select value={damageType} onValueChange={(value) => setDamageType(value as DamageType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select damage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scratch">Scratch</SelectItem>
                  <SelectItem value="dent">Dent</SelectItem>
                  <SelectItem value="paint">Paint Damage</SelectItem>
                  <SelectItem value="glass">Glass/Window</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="damageLocation">Location (Optional)</Label>
              <Input
                id="damageLocation"
                placeholder="e.g., Front bumper, Rear door"
                value={damageLocation}
                onChange={(e) => setDamageLocation(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="damageDescription">Description</Label>
            <Input
              id="damageDescription"
              placeholder="Describe the damage"
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Severity</Label>
            <RadioGroup 
              value={damageSeverity}
              onValueChange={(v) => setDamageSeverity(v as 'minor' | 'moderate' | 'severe')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor">Minor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="moderate" />
                <Label htmlFor="moderate">Moderate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="severe" id="severe" />
                <Label htmlFor="severe">Severe</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button type="button" onClick={handleAddDamage} className="w-full">
            Add Damage Report
          </Button>
        </div>
        
        {/* List of Added Damage Reports */}
        {allDamages.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Added Damage Reports</h3>
            <div className="space-y-2">
              {allDamages.map((damage, index) => (
                <div key={damage.id || index} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium capitalize">{damage.type}</p>
                    <p className="text-sm text-gray-600">{damage.description}</p>
                    {damage.location && (
                      <p className="text-xs text-gray-500">Location: {damage.location}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveDamage(damage.id)}
                    className="hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
