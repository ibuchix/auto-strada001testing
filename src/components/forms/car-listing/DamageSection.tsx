
/**
 * Changes made:
 * - Updated to use the useDamageSection custom hook
 * - Simplified component with extracted logic
 * - Improved code organization and readability
 * - Updated to use FormDataContext instead of requiring form prop
 * - 2025-07-22: Updated to use DamageType from types/forms
 * - 2025-07-25: Fixed DamageType import
 * - 2025-05-20: Updated property names to use snake_case to match database schema
 */

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DamageType } from "@/types/forms";
import { useDamageSection } from "./hooks/useDamageSection";
import { useFormData } from "./context/FormDataContext";

interface DamageSectionProps {
  carId?: string;
}

export const DamageSection = ({ carId }: DamageSectionProps) => {
  const { form } = useFormData();
  
  const {
    isDamaged,
    damageReports,
    newDamage,
    updateNewDamage,
    addDamageReport,
    removeDamageReport,
    handleDamagePhotoUpload,
    validateDamageSection
  } = useDamageSection(form);

  if (!isDamaged) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Damage Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You've indicated that your vehicle is not damaged. If this is incorrect, 
            please go back to the Vehicle Status section and update your selection.
          </p>
        </CardContent>
      </Card>
    );
  }

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
                  updateNewDamage('type', value)}
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
                onChange={(e) => updateNewDamage('description', e.target.value)}
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
