
/**
 * DamageDetailsSection Component
 * Updated: 2025-05-04 - Fixed TypeScript error with DamageReport ID field
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 */

import { useFormData } from "../context/FormDataContext";
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { DamageReport, DamageType } from "@/types/forms";
import { v4 as uuidv4 } from "uuid";
import { watchField, setFieldValue } from "@/utils/formHelpers";

export const DamageDetailsSection = () => {
  const { form } = useFormData();
  const [newDamage, setNewDamage] = useState({
    type: 'scratch' as DamageType,
    location: '',
    description: '',
    severity: 'minor' as 'minor' | 'moderate' | 'severe'
  });
  
  const damageReports = watchField<DamageReport[]>(form, "damageReports") || [];
  
  const addDamageReport = () => {
    const newReport: DamageReport = {
      id: uuidv4(),
      type: newDamage.type,
      description: newDamage.description,
      location: newDamage.location,
      severity: newDamage.severity,
      photo: undefined
    };
    
    const updatedReports = [...damageReports, newReport];
    setFieldValue(form, "damageReports", updatedReports, { shouldDirty: true });
    
    // Reset the form
    setNewDamage({
      type: 'scratch',
      location: '',
      description: '',
      severity: 'minor'
    });
  };
  
  const removeDamageReport = (id: string) => {
    const updatedReports = damageReports.filter(report => report.id !== id);
    setFieldValue(form, "damageReports", updatedReports, { shouldDirty: true });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Damage Details</h3>
      
      <div className="bg-muted/40 rounded-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Type of Damage</label>
            <Select 
              value={newDamage.type}
              onValueChange={(value: DamageType) => setNewDamage({...newDamage, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select damage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scratch">Scratch</SelectItem>
                <SelectItem value="dent">Dent</SelectItem>
                <SelectItem value="paint">Paint damage</SelectItem>
                <SelectItem value="glass">Glass/window damage</SelectItem>
                <SelectItem value="mechanical">Mechanical issue</SelectItem>
                <SelectItem value="structural">Structural damage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Location on Vehicle</label>
            <Input 
              placeholder="e.g. Front bumper, driver side door" 
              value={newDamage.location}
              onChange={(e) => setNewDamage({...newDamage, location: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea 
            placeholder="Describe the damage in detail" 
            className="min-h-[80px]"
            value={newDamage.description}
            onChange={(e) => setNewDamage({...newDamage, description: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Severity</label>
            <Select 
              value={newDamage.severity}
              onValueChange={(value: 'minor' | 'moderate' | 'severe') => setNewDamage({...newDamage, severity: value})}
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
        
        <Button 
          type="button" 
          onClick={addDamageReport} 
          disabled={!newDamage.description || !newDamage.location}
          className="mt-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Damage Report
        </Button>
      </div>
      
      {damageReports.length > 0 && (
        <div className="border rounded-md p-4">
          <h4 className="font-medium mb-4">Damage Reports</h4>
          <div className="space-y-3">
            {damageReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-md">
                <div>
                  <p className="font-medium">{report.type} - {report.location}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Severity: {report.severity}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDamageReport(report.id)}
                  title="Remove damage report"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
