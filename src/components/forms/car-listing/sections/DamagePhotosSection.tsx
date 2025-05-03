
/**
 * Damage Photos Section Component
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
import { Upload } from 'lucide-react';

export const DamagePhotosSection = () => {
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

  const handleAddPhoto = () => {
    if (!damageDescription) {
      return; // Don't add empty damage reports
    }
    
    // Create a new damage report with a unique ID
    const newDamage: DamageReport = {
      id: uuidv4(),
      type: damageType,
      description: damageDescription,
      photo: null,
      location: damageLocation,
      severity: damageSeverity
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
        <CardTitle>Damage Photos</CardTitle>
        <CardDescription>Upload photos of any damage to your vehicle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Upload clear photos of any damage
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG or WebP (max. 10MB)
            </p>
            <Button className="mt-4" variant="outline" type="button">
              Select Files
            </Button>
          </div>
          
          {/* Damage description form */}
          <div className="space-y-4 mt-6">
            <h3 className="text-base font-medium">Damage Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="damageType">Type of Damage</Label>
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
                <Label htmlFor="damageSeverity">Severity</Label>
                <Select 
                  value={damageSeverity} 
                  onValueChange={(value) => setDamageSeverity(value as 'minor' | 'moderate' | 'severe')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="damageLocation">Location</Label>
              <Input
                id="damageLocation"
                placeholder="e.g. Front bumper, Driver's door"
                value={damageLocation}
                onChange={(e) => setDamageLocation(e.target.value)}
              />
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
            
            <Button type="button" onClick={handleAddPhoto}>
              Add Damage Report
            </Button>
          </div>
          
          {/* Display damage reports */}
          {allDamages.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-base font-medium">Uploaded Damage Reports</h3>
              
              <div className="space-y-4">
                {allDamages.map((damage, index) => (
                  <div key={damage.id || index} className="flex items-start justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium capitalize">{damage.type}</p>
                      <p className="text-sm">{damage.description}</p>
                      {damage.location && <p className="text-xs text-gray-500">Location: {damage.location}</p>}
                      <p className="text-xs text-gray-500">Severity: {damage.severity}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveDamage(damage.id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
