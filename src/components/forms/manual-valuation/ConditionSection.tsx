
/**
 * Condition Section Component
 * Created: 2025-06-20
 * Updated: 2025-06-22 - Fixed conditionRating field handling
 */

import { FormField } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface ConditionSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const ConditionSection = ({ form }: ConditionSectionProps) => {
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-lg mb-4">Vehicle Condition</h2>
      <p className="text-gray-600 mb-6">
        Please rate the overall condition of your vehicle.
      </p>

      <FormField
        control={form.control}
        name="conditionRating"
        render={({ field }) => (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Overall Condition Rating
              </label>
              <div className="grid grid-cols-5 text-sm text-center mb-2">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Very Good</span>
                <span>Excellent</span>
              </div>
              <Slider
                defaultValue={[field.value || 3]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => field.onChange(value[0])}
                className="mt-1"
              />
              <div className="grid grid-cols-5 text-xs text-center mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm font-medium mb-2">Poor (1)</div>
                <p className="text-xs text-gray-600">
                  Significant wear and tear, may have mechanical issues
                </p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm font-medium mb-2">Fair (2)</div>
                <p className="text-xs text-gray-600">
                  Noticeable cosmetic issues, some mechanical wear
                </p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm font-medium mb-2">Good (3)</div>
                <p className="text-xs text-gray-600">
                  Normal wear for age and mileage, no major issues
                </p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm font-medium mb-2">Very Good (4)</div>
                <p className="text-xs text-gray-600">
                  Minor wear, well maintained, no significant issues
                </p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm font-medium mb-2">Excellent (5)</div>
                <p className="text-xs text-gray-600">
                  Exceptional condition, minimal wear, like new
                </p>
              </div>
            </div>
          </div>
        )}
      />
    </Card>
  );
};
