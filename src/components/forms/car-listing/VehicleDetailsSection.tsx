
/**
 * Changes made:
 * - Enhanced auto-fill functionality to use VIN validation data
 * - Added localStorage retrieval of validation data
 * - Improved error handling and feedback
 * - Updated to use the useFormData custom hook
 */

import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicleDetailsSection } from "./hooks/useVehicleDetailsSection";
import { FormSection } from "./FormSection";
import { Search, RefreshCw } from "lucide-react";
import { useFormData } from "./context/FormDataContext";
import { toast } from "sonner";

export const VehicleDetailsSection = () => {
  const [vinValue, setVinValue] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { form } = useFormData();
  
  const {
    isLoading,
    availableModels,
    yearOptions,
    handleVinLookup,
    validateVehicleDetails
  } = useVehicleDetailsSection(form);
  
  const handleAutoFill = async () => {
    try {
      setIsAutoFilling(true);
      
      // Retrieve valuation data from localStorage
      const valuationDataString = localStorage.getItem('valuationData');
      if (!valuationDataString) {
        toast.error("No vehicle data found", {
          description: "Please complete a VIN check first to auto-fill details"
        });
        return;
      }
      
      const valuationData = JSON.parse(valuationDataString);
      
      // Fill in form fields with validation data
      if (valuationData.vin) form.setValue('vin', valuationData.vin);
      if (valuationData.make) form.setValue('make', valuationData.make);
      if (valuationData.model) form.setValue('model', valuationData.model);
      if (valuationData.year) form.setValue('year', parseInt(valuationData.year));
      if (valuationData.mileage) form.setValue('mileage', parseInt(valuationData.mileage));
      
      // Try to get transmission from localStorage or set default
      const gearbox = localStorage.getItem('tempGearbox');
      if (gearbox) {
        form.setValue('transmission', gearbox as 'manual' | 'automatic');
      } else if (valuationData.transmission) {
        form.setValue('transmission', valuationData.transmission);
      }
      
      toast.success("Vehicle details auto-filled", {
        description: "Details have been filled from your VIN check"
      });
    } catch (error) {
      console.error("Error auto-filling data:", error);
      toast.error("Failed to auto-fill vehicle details", {
        description: "Please try again or enter details manually"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };
  
  return (
    <FormSection title="Vehicle Details">
      <div className="space-y-6">
        {/* VIN Lookup */}
        <div className="flex flex-col space-y-2">
          <FormLabel htmlFor="vin-lookup">VIN Lookup (Optional)</FormLabel>
          <div className="flex space-x-2">
            <Input
              id="vin-lookup"
              placeholder="Enter Vehicle Identification Number"
              value={vinValue}
              onChange={(e) => setVinValue(e.target.value)}
              maxLength={17}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={() => handleVinLookup(vinValue)}
              disabled={isLoading || vinValue.length !== 17}
            >
              <Search className="mr-2 h-4 w-4" />
              Lookup
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the 17-character VIN to automatically fill in vehicle details
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAutoFill}
            disabled={isAutoFilling}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isAutoFilling ? 'animate-spin' : ''}`} />
            {isAutoFilling ? 'Auto-filling...' : 'Auto-fill from VIN Check'}
          </Button>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Make */}
          <FormField
            control={form.control}
            name="make"
            rules={{ required: "Make is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make<span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["BMW", "Audi", "Mercedes", "Volkswagen", "Ford", "Toyota", "Honda"].map(
                      (make) => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Model */}
          <FormField
            control={form.control}
            name="model"
            rules={{ required: "Model is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model<span className="text-destructive">*</span></FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={availableModels.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        availableModels.length === 0 
                          ? "Select make first" 
                          : "Select model"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Year */}
          <FormField
            control={form.control}
            name="year"
            rules={{ required: "Year is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year<span className="text-destructive">*</span></FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mileage */}
          <FormField
            control={form.control}
            name="mileage"
            rules={{ 
              required: "Mileage is required",
              min: { value: 0, message: "Mileage must be a positive number" }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mileage (km)<span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 50000" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* VIN */}
          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VIN</FormLabel>
                <FormControl>
                  <Input placeholder="Vehicle Identification Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Transmission */}
          <FormField
            control={form.control}
            name="transmission"
            rules={{ required: "Transmission is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmission<span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </FormSection>
  );
};
