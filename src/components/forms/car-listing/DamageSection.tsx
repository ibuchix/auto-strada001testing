import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { DamageType } from "./types/damages";
import { PhotoUpload } from "./photo-upload/PhotoUpload";
import { toast } from "sonner";

interface DamageSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const DamageSection = ({ form, carId }: DamageSectionProps) => {
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);
  const [description, setDescription] = useState('');

  const handleDamagePhotoUpload = async (file: File) => {
    if (!carId) {
      toast.error("Please save the form first before uploading damage photos");
      return;
    }

    if (!selectedDamageType) {
      toast.error("Please select a damage type first");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', `damage_${selectedDamageType}`);
    formData.append('carId', carId);

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');

      const { filePath } = await response.json();
      
      const currentDamages = form.getValues('damageReports') || [];
      form.setValue('damageReports', [...currentDamages, {
        type: selectedDamageType,
        description,
        photoPath: filePath
      }]);

      setSelectedDamageType(null);
      setDescription('');
      
      toast.success('Damage report added successfully');
    } catch (error) {
      toast.error('Failed to upload damage photo');
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Damage Reports
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Damage Type</Label>
            <Select 
              value={selectedDamageType || undefined} 
              onValueChange={(value) => setSelectedDamageType(value as DamageType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select damage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scratches">Scratches</SelectItem>
                <SelectItem value="dents">Dents</SelectItem>
                <SelectItem value="paintwork">Paintwork Problems</SelectItem>
                <SelectItem value="windscreen">Windscreen Damages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the damage"
            />
          </div>
        </div>
        {selectedDamageType && (
          <div>
            <Label>Upload Photo</Label>
            <PhotoUpload
              id={`damage_${selectedDamageType}`}
              label="Upload damage photo"
              isUploading={false}
              onFileSelect={handleDamagePhotoUpload}
            />
          </div>
        )}
      </div>
    </Card>
  );
};