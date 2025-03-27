
/**
 * Changes made:
 * - Fixed type errors for DamageType and DamageReport
 * - Updated DamageReport interface to match the one in types/forms.ts
 * - Made photo nullable instead of optional to match the type definition
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData, DamageType, DamageReport } from "@/types/forms";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DamageSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const DamageSection = ({ form, carId }: DamageSectionProps) => {
  const [newDamage, setNewDamage] = useState<DamageReport>({
    type: "scratch",
    description: "",
    photo: null, // Initialize as null to match the required type
  });

  // Get the damage reports from form values or initialize as empty array
  const damageReports = form.getValues().damageReports || [];
  
  // Add a new damage report
  const addDamageReport = () => {
    if (!newDamage.description.trim()) return;
    
    const updatedReports = [...damageReports, { ...newDamage }];
    form.setValue("damageReports", updatedReports, { shouldValidate: true });
    
    // Reset new damage form
    setNewDamage({
      type: "scratch",
      description: "",
      photo: null, // Reset with null
    });
  };

  // Remove a damage report
  const removeDamageReport = (index: number) => {
    const updatedReports = [...damageReports];
    updatedReports.splice(index, 1);
    form.setValue("damageReports", updatedReports, { shouldValidate: true });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Damage Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* List existing damage reports */}
        {damageReports.length > 0 ? (
          <div className="space-y-4">
            {damageReports.map((report, index) => (
              <div key={index} className="border rounded-md p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium capitalize">{report.type}</p>
                  <p className="text-sm text-gray-500">{report.description}</p>
                  {report.location && (
                    <p className="text-sm text-gray-500">Location: {report.location}</p>
                  )}
                  {report.severity && (
                    <p className="text-sm text-gray-500">Severity: {report.severity}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeDamageReport(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No damage reports added yet.</p>
        )}

        {/* Form to add new damage reports */}
        <div className="space-y-4 border-t pt-4 mt-4">
          <h3 className="font-medium">Add New Damage Report</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="damage-type">Damage Type</Label>
              <Select
                value={newDamage.type}
                onValueChange={(value: DamageType) => 
                  setNewDamage({ ...newDamage, type: value })}
              >
                <SelectTrigger id="damage-type">
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
              <Label htmlFor="damage-description">Description</Label>
              <Input
                id="damage-description"
                value={newDamage.description}
                onChange={(e) => setNewDamage({ ...newDamage, description: e.target.value })}
                placeholder="Describe the damage"
              />
            </div>
          </div>
          
          <Button 
            type="button" 
            onClick={addDamageReport}
            disabled={!newDamage.description.trim()}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Damage Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
