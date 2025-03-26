
/**
 * Changes made:
 * - 2024-08-04: Fixed types to properly handle damageReports property
 * - 2024-08-05: Fixed damage type compatibility issues
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData, DamageType, DamageReport } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { DamageTypeSelect } from "./damage/DamageTypeSelect";
import { DamageDescription } from "./damage/DamageDescription";
import { DamagePhotoUpload } from "./damage/DamagePhotoUpload";

interface DamageSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const DamageSection = ({ form, carId }: DamageSectionProps) => {
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);
  const [description, setDescription] = useState('');

  const handlePhotoUploaded = (filePath: string) => {
    // Initialize damageReports if it doesn't exist
    if (!form.getValues().damageReports) {
      form.setValue('damageReports', []);
    }

    // Add the new damage report
    const currentDamages = form.getValues().damageReports || [];
    const newDamage: DamageReport = {
      type: selectedDamageType as DamageType,
      description,
      photoPath: filePath
    };
    
    form.setValue('damageReports', [...currentDamages, newDamage]);

    // Reset form
    setSelectedDamageType(null);
    setDescription('');
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Damage Reports
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DamageTypeSelect 
            value={selectedDamageType} 
            onValueChange={(value: DamageType) => setSelectedDamageType(value)}
          />
          <DamageDescription 
            value={description}
            onChange={setDescription}
          />
        </div>
        {selectedDamageType && (
          <DamagePhotoUpload
            damageType={selectedDamageType}
            carId={carId}
            onPhotoUploaded={handlePhotoUploaded}
          />
        )}
      </div>
    </Card>
  );
};
