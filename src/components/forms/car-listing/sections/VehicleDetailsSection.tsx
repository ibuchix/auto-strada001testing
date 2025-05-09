
/**
 * Vehicle Details Section for Car Listing Form
 * Updated: 2025-05-05 - Removed redundant VIN lookup for users coming from valuation
 * Updated: 2025-05-05 - Added auto-population of fields from valuation data
 * Updated: 2025-05-06 - Fixed TypeScript errors related to error handling and form props
 */

import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { FormSection } from "../FormSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useVinLookup } from "../hooks/vehicle-details/useVinLookup";
import { Loader2 } from "lucide-react";
import { useVehicleDataManager } from "../hooks/vehicle-details/useVehicleDataManager";
import { getStoredValidationData } from "@/services/supabase/valuation/vinValidationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/errors/FieldError";

export const VehicleDetailsSection = () => {
  const { form } = useFormData();
  const { isLoading, handleVinLookup } = useVinLookup(form);
  const { hasVehicleData, applyVehicleDataToForm } = useVehicleDataManager(form);
  const [vin, setVin] = useState("");
  const [fromValuation, setFromValuation] = useState(false);
  const [valuationDataApplied, setValuationDataApplied] = useState(false);

  // Get form values
  const currentVin = form.watch("vin");
  const make = form.watch("make");
  const model = form.watch("model");
  const year = form.watch("year");
  const mileage = form.watch("mileage");
  const transmission = form.watch("transmission");
  const hasFormData = !!(make && model && year);

  // Check if we're coming from valuation and have data
  useEffect(() => {
    // Check if we have valuation data in localStorage
    const storedData = getStoredValidationData();
    const hasUrlParam = window.location.search.includes('from=valuation') || window.location.search.includes('fromValuation=true');
    const hasStateParam = localStorage.getItem('fromValuation') === 'true';
    
    setFromValuation(hasUrlParam || hasStateParam || !!storedData);
    
    // If we have valuation data and haven't applied it yet, auto-fill the form
    if (storedData && !valuationDataApplied && !hasFormData) {
      console.log("Auto-filling form with valuation data:", storedData);
      
      form.setValue("vin", storedData.vin || "");
      form.setValue("make", storedData.make || "");
      form.setValue("model", storedData.model || "");
      form.setValue("year", storedData.year || "");
      form.setValue("mileage", storedData.mileage || "");
      form.setValue("transmission", storedData.transmission || "");
      
      // Set a flag to indicate we've applied the data
      setValuationDataApplied(true);
      
      // Create VIN reservation automatically if coming from valuation
      if (storedData.vin) {
        handleVinLookup(storedData.vin);
      }
    }
  }, [form, valuationDataApplied, hasFormData]);
  
  const handleVinSubmit = (e) => {
    e.preventDefault();
    if (vin) {
      handleVinLookup(vin);
    }
  };

  return (
    <FormSection title="Vehicle Details" subtitle="Enter your vehicle's basic information">
      <div className="space-y-6">
        {/* Show VIN lookup only if NOT coming from valuation */}
        {!fromValuation && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">VIN Lookup</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="vin-lookup">Vehicle Identification Number (VIN)</Label>
                <Input 
                  id="vin-lookup" 
                  placeholder="Enter your vehicle's VIN" 
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleVinSubmit} 
                  disabled={isLoading || !vin}
                  className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Looking up...
                    </>
                  ) : "Lookup VIN"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Enter your vehicle's VIN to automatically populate vehicle details
            </p>
          </div>
        )}

        {/* Manual input fields - always visible */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vin">VIN*</Label>
              <Input
                id="vin"
                {...form.register("vin")}
                placeholder="Vehicle Identification Number"
              />
              <FieldError message={form.formState.errors.vin?.message?.toString()} />
            </div>

            <div>
              <Label htmlFor="year">Year*</Label>
              <Input
                id="year"
                type="number"
                {...form.register("year", { valueAsNumber: true })}
                placeholder="Vehicle Year"
              />
              <FieldError message={form.formState.errors.year?.message?.toString()} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make*</Label>
              <Input
                id="make"
                {...form.register("make")}
                placeholder="Vehicle Make (e.g., Toyota)"
              />
              <FieldError message={form.formState.errors.make?.message?.toString()} />
            </div>

            <div>
              <Label htmlFor="model">Model*</Label>
              <Input
                id="model"
                {...form.register("model")}
                placeholder="Vehicle Model (e.g., Camry)"
              />
              <FieldError message={form.formState.errors.model?.message?.toString()} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mileage">Mileage*</Label>
              <Input
                id="mileage"
                type="number"
                {...form.register("mileage", { valueAsNumber: true })}
                placeholder="Vehicle Mileage"
              />
              <FieldError message={form.formState.errors.mileage?.message?.toString()} />
            </div>

            <div>
              <Label htmlFor="transmission">Transmission*</Label>
              <Select
                onValueChange={(value) => form.setValue("transmission", value)}
                defaultValue={form.watch("transmission")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transmission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="semi-automatic">Semi-automatic</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={form.formState.errors.transmission?.message?.toString()} />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
};

