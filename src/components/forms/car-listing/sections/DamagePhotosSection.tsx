
/**
 * DamagePhotosSection Component
 * Allows sellers to upload photos of vehicle damage
 * Updated: 2025-05-03 - Fixed TypeScript errors related to DamageReport type
 */

import { useFormData } from "../context/FormDataContext";
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { DamageType, DamageReport } from "@/types/forms";

export const DamagePhotosSection = () => {
  const { form } = useFormData();
  const [damageType, setDamageType] = useState<DamageType>("scratch");
  const [damageDescription, setDamageDescription] = useState("");
  const [damageLocation, setDamageLocation] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const isDamaged = form.watch("isDamaged");
  const damages = form.watch("damages") || [];
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const addDamagePhoto = () => {
    if (!damageDescription || !damageLocation || !imagePreview) return;
    
    const newDamagePhoto: DamageReport = {
      id: uuidv4(),
      type: damageType,
      description: damageDescription,
      photo: imagePreview,
      location: damageLocation,
      severity: "minor"
    };
    
    const updatedDamages = [...damages, newDamagePhoto];
    form.setValue("damages", updatedDamages, { shouldDirty: true });
    
    // Reset form
    setDamageType("scratch");
    setDamageDescription("");
    setDamageLocation("");
    setSelectedFile(null);
    setImagePreview(null);
  };
  
  const removeDamagePhoto = (index: number) => {
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
      <h3 className="text-lg font-semibold">Damage Photos</h3>
      <p className="text-sm text-gray-500">Upload photos of any damage to the vehicle</p>
      
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
        
        <div className="space-y-2">
          <FormLabel>Photo</FormLabel>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Damage preview" 
                  className="max-h-40 mx-auto object-contain" 
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Click to upload a photo of the damage</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
              </>
            )}
            
            <Input
              id="damage-photo"
              type="file"
              className={imagePreview ? "hidden" : "opacity-0 absolute inset-0 cursor-pointer"}
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        <Button
          type="button"
          onClick={addDamagePhoto}
          disabled={!damageDescription || !damageLocation || !imagePreview}
        >
          Add Damage Photo
        </Button>
      </div>
      
      {damages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Damage Photos</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {damages.map((damage, index) => (
              <div
                key={damage.id || index}
                className="border rounded-md p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium capitalize">{damage.type} - {damage.location}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDamagePhoto(index)}
                  >
                    Remove
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{damage.description}</p>
                {damage.photo && (
                  <img 
                    src={damage.photo} 
                    alt={`Damage ${index + 1}`} 
                    className="w-full h-32 object-cover rounded" 
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
