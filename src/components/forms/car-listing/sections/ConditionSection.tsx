
/**
 * ConditionSection Component
 * Created: 2025-06-20 - Added initial implementation
 * 
 * Allows the user to select the vehicle's condition and service history
 */

import { useState } from 'react';
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormData } from "../context/FormDataContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';
import { ServiceHistoryUploader } from '../ServiceHistoryUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ConditionSection = () => {
  const { form } = useFormData();
  const [showServiceDocuments, setShowServiceDocuments] = useState(
    form.watch('hasServiceHistory') === true
  );
  
  const handleServiceHistoryChange = (checked: boolean) => {
    form.setValue('hasServiceHistory', checked, { shouldValidate: true });
    setShowServiceDocuments(checked);
    
    if (!checked) {
      form.setValue('serviceHistoryType', 'none', { shouldValidate: true });
      form.setValue('serviceHistoryFiles', [], { shouldValidate: true });
    }
  };

  const handleServiceHistoryTypeChange = (value: string) => {
    form.setValue('serviceHistoryType', value as 'full' | 'partial' | 'none', { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition & History</CardTitle>
          <CardDescription>
            Tell us about the vehicle's service history and condition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="hasServiceHistory"
                checked={form.watch('hasServiceHistory')}
                onCheckedChange={handleServiceHistoryChange}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="hasServiceHistory" className="font-medium">
                  This vehicle has service history
                </Label>
                <p className="text-sm text-muted-foreground">
                  Check this if you have any service history for the vehicle
                </p>
              </div>
            </div>
          </div>

          {showServiceDocuments && (
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Type of service history</FormLabel>
                <Select
                  value={form.watch('serviceHistoryType') || 'none'}
                  onValueChange={handleServiceHistoryTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service history type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Service History</SelectItem>
                    <SelectItem value="partial">Partial Service History</SelectItem>
                    <SelectItem value="none">No Documentation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>

              {(form.watch('serviceHistoryType') === 'full' || form.watch('serviceHistoryType') === 'partial') && (
                <ServiceHistoryUploader />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
