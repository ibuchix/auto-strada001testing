
/**
 * Changes made:
 * - Updated to use the centralized vehicle data service for auto-fill
 * - Improved error handling and user feedback during auto-fill
 * - Added validation before applying auto-fill data
 * - Enhanced loading states for better user experience
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
import { hasCompleteVehicleData } from "@/services/vehicleDataService";

export const VehicleDetailsSection = () => {
  const [vinValue, setVinValue] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { form } = useFormData();
  
  const {
    isLoading,
    availableModels,
    yearOptions,
    handleVinLookup,
    handleAutoFill
  } = useVehicleDetailsSection(form);
  
  const performAutoFill = async () => {
    try {
      setIsAutoFilling(true);
      
      // Validate that we have complete vehicle data before attempting auto-fill
      if (!hasCompleteVehicleData()) {
        toast.error("Incomplete vehicle data", {
          description: "Please complete a VIN check first to auto-fill details"
        });
        return;
      }
      
      // Call the hook's auto-fill function
      const success = await handleAutoFill();
      
      if (success) {
        toast.success("Vehicle details auto-filled", {
          description: "Successfully populated form with vehicle data"
        });
      } else {
        toast.error("Auto-fill failed", {
          description: "Could not apply vehicle data to the form"
        });
      }
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
              variant="default"
            >
              <Search className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Looking up...' : 'Lookup'}
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
            onClick={performAutoFill}
            disabled={isAutoFilling || isLoading}
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
