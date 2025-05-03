
/**
 * DamageDetailsSection Component
 * Displays and handles car damage details
 * Updated: 2025-05-03 - Fixed TypeScript errors related to DamageReport type
 */

import { useFormData } from "../context/FormDataContext";
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from "uuid";
import { DamageType, DamageReport } from "@/types/forms";

export const DamageDetailsSection = () => {
  const { form } = useFormData();
  const [damageType, setDamageType] = useState<DamageType>("scratch");
  const [damageLocation, setDamageLocation] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  
  const isDamaged = form.watch("isDamaged");
  const damages = form.watch("damages") || [];
  
  const addDamage = () => {
    if (!damageLocation || !damageDescription) return;
    
    const newDamage: DamageReport = {
      id: uuidv4(), // Add a unique ID
      type: damageType,
      location: damageLocation,
      description: damageDescription,
      severity: "minor",
      photo: null
    };
    
    const updatedDamages = [...damages, newDamage];
    
    form.setValue("damages", updatedDamages, { shouldDirty: true });
    
    // Reset form
    setDamageType("scratch");
    setDamageLocation("");
    setDamageDescription("");
  };
  
  const removeDamage = (index: number) => {
    const updatedDamages = [...damages];
    updatedDamages.splice(index, 1);
    
    form.setValue("damages", updatedDamages, { shouldDirty: true });
  };
  
  if (!isDamaged) {
    return (
      <div className="text-gray-500 italic">
        You have indicated that the vehicle has no damage. If this changes, please update the vehicle status.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Damage Details</h3>
      <p className="text-sm text-gray-500">Please provide details about any damage to the vehicle</p>
      
      <div className="space-y-4 border p-4 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>Damage Type</FormLabel>
            <Select
              value={damageType}
              onValueChange={(value) => setDamageType(value as DamageType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select damage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scratch">Scratch</SelectItem>
                <SelectItem value="dent">Dent</SelectItem>
                <SelectItem value="crack">Crack</SelectItem>
                <SelectItem value="tear">Tear</SelectItem>
                <SelectItem value="missing">Missing Part</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <FormLabel>Location</FormLabel>
            <Input
              value={damageLocation}
              onChange={(e) => setDamageLocation(e.target.value)}
              placeholder="e.g. Front bumper, driver side door"
            />
          </div>
        </div>
        
        <div>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={damageDescription}
            onChange={(e) => setDamageDescription(e.target.value)}
            placeholder="Please describe the damage in detail"
          />
        </div>
        
        <Button
          type="button"
          onClick={addDamage}
          disabled={!damageLocation || !damageDescription}
        >
          Add Damage
        </Button>
      </div>
      
      {damages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Reported Damage</h4>
          
          <div className="space-y-2">
            {damages.map((damage, index) => (
              <div
                key={damage.id || index}
                className="border rounded-md p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium capitalize">{damage.type} - {damage.location}</p>
                  <p className="text-sm text-gray-600">{damage.description}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDamage(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
