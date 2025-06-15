/**
 * Vehicle Details Section for Car Listing Form
 * Updated: 2025-05-30 - Added reserve price field from valuation data, consolidated pricing into vehicle details
 * 2025-06-15: Added optional fuel type select dropdown; fixed isDamaged to simple checkbox.
 */

import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { FormSection } from "../FormSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useVinLookup } from "../hooks/vehicle-details/useVinLookup";
import { Loader2, LockIcon } from "lucide-react";
import { useVehicleDataManager } from "../hooks/vehicle-details/useVehicleDataManager";
import { getStoredValidationData } from "@/services/supabase/valuation/vinValidationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/errors/FieldError";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const VehicleDetailsSection = () => {
  const { form } = useFormData();
  const { isLoading, handleVinLookup, sessionChecked } = useVinLookup(form);
  const { hasVehicleData, applyVehicleDataToForm } = useVehicleDataManager(form);
  const [vin, setVin] = useState("");
  const [fromValuation, setFromValuation] = useState(false);
  const [valuationDataApplied, setValuationDataApplied] = useState(false);
  const [waitingForSession, setWaitingForSession] = useState(true);

  // Get form values
  const currentVin = form.watch("vin");
  const make = form.watch("make");
  const model = form.watch("model");
  const year = form.watch("year");
  const mileage = form.watch("mileage");
  const transmission = form.watch("transmission");
  const reservePrice = form.watch("reservePrice");
  const valuationData = form.watch("valuationData");
  const hasFormData = !!(make && model && year);
  const fuelType = form.watch("fuelType");

  // Check if user session is available
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data.session) {
          setWaitingForSession(false);
          console.log("Session available in VehicleDetailsSection:", !!data.session);
        }
      } catch (error) {
        console.error("Error checking session in VehicleDetailsSection:", error);
        if (mounted) {
          setWaitingForSession(false);
        }
      }
    };
    
    // Only check session if we're still waiting
    if (waitingForSession) {
      checkSession();
    }
    
    return () => {
      mounted = false;
    };
  }, [waitingForSession]);

  // Check if we're coming from valuation and have data
  useEffect(() => {
    // Only proceed if session is available and we're not still loading
    if (waitingForSession || !sessionChecked) {
      return;
    }
    
    // Check if we have valuation data in localStorage
    const storedData = getStoredValidationData();
    const hasUrlParam = window.location.search.includes('from=valuation') || window.location.search.includes('fromValuation=true');
    const hasStateParam = localStorage.getItem('fromValuation') === 'true';
    
    setFromValuation(hasUrlParam || hasStateParam || !!storedData);
    
    // If we have valuation data and haven't applied it yet, auto-fill the form
    if (storedData && !valuationDataApplied && !hasFormData) {
      console.log("Auto-filling form with valuation data:", storedData);
      
      form.setValue("vin", storedData.vin || "");
      
      // Safely convert year to number or use default
      if (storedData.year) {
        const yearValue = typeof storedData.year === 'number' 
          ? storedData.year 
          : parseInt(String(storedData.year), 10);
        
        if (!isNaN(yearValue)) {
          form.setValue("year", yearValue);
        }
      }
      
      // Safely convert mileage to number or use default
      if (storedData.mileage) {
        const mileageValue = typeof storedData.mileage === 'number' 
          ? storedData.mileage 
          : parseInt(String(storedData.mileage), 10);
        
        if (!isNaN(mileageValue)) {
          form.setValue("mileage", mileageValue); 
        }
      }
      
      form.setValue("make", storedData.make || "");
      form.setValue("model", storedData.model || "");
      
      // Validate and assign transmission
      if (storedData.transmission) {
        const validTransmission = ["manual", "automatic", "semi-automatic"].includes(storedData.transmission)
          ? storedData.transmission as "manual" | "automatic" | "semi-automatic"
          : "manual";
        
        form.setValue("transmission", validTransmission);
      }
      
      // Set reserve price from valuation data
      const reservePriceValue = storedData.reservePrice || storedData.valuation || 0;
      if (reservePriceValue > 0) {
        form.setValue("reservePrice", reservePriceValue);
        form.setValue("fromValuation", true);
        form.setValue("valuationData", storedData);
      }
      
      // Set a flag to indicate we've applied the data
      setValuationDataApplied(true);
      
      // Create VIN reservation automatically if coming from valuation
      if (storedData.vin) {
        console.log("Creating VIN reservation from valuation data");
        handleVinLookup(storedData.vin);
      }
    }
  }, [form, valuationDataApplied, hasFormData, waitingForSession, sessionChecked, handleVinLookup]);
  
  const handleVinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin) {
      handleVinLookup(vin);
    }
  };

  // Fuel Type dropdown options
  const fuelTypeOptions = [
    { label: "Petrol", value: "petrol" },
    { label: "Diesel", value: "diesel" },
    { label: "Hybrid", value: "hybrid" },
    { label: "Electric", value: "electric" },
    { label: "LPG", value: "lpg" },
    { label: "Other", value: "other" },
  ];

  // Show loading state if we're still waiting for the session
  if (waitingForSession) {
    return (
      <FormSection title="Vehicle Details" subtitle="Preparing vehicle details form...">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
          <span className="ml-2">Loading user session data...</span>
        </div>
      </FormSection>
    );
  }

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
          {/* Show VIN lookup only if NOT coming from valuation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vin">VIN*</Label>
              <Input
                id="vin"
                {...form.register("vin")}
                placeholder="Vehicle Identification Number"
              />
              <FieldError message={form.formState.errors.vin?.message ? String(form.formState.errors.vin?.message) : undefined} />
            </div>

            <div>
              <Label htmlFor="year">Year*</Label>
              <Input
                id="year"
                type="number"
                {...form.register("year", { valueAsNumber: true })}
                placeholder="Vehicle Year"
              />
              <FieldError message={form.formState.errors.year?.message ? String(form.formState.errors.year?.message) : undefined} />
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
              <FieldError message={form.formState.errors.make?.message ? String(form.formState.errors.make?.message) : undefined} />
            </div>

            <div>
              <Label htmlFor="model">Model*</Label>
              <Input
                id="model"
                {...form.register("model")}
                placeholder="Vehicle Model (e.g., Camry)"
              />
              <FieldError message={form.formState.errors.model?.message ? String(form.formState.errors.model?.message) : undefined} />
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
              <FieldError message={form.formState.errors.mileage?.message ? String(form.formState.errors.mileage?.message) : undefined} />
            </div>

            <div>
              <Label htmlFor="transmission">Transmission*</Label>
              <Select
                onValueChange={(value: "manual" | "automatic" | "semi-automatic") => form.setValue("transmission", value)}
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
              <FieldError message={form.formState.errors.transmission?.message ? String(form.formState.errors.transmission?.message) : undefined} />
            </div>
          </div>

          {/* Fuel Type Field */}
          <div>
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select
              onValueChange={(value: string) => form.setValue("fuelType", value)}
              defaultValue={fuelType || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Fuel type is optional but helps buyers make informed decisions.
            </p>
          </div>

          {/* Reserve Price Field - only show if from valuation */}
          {fromValuation && reservePrice > 0 && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <AlertDescription className="font-medium text-blue-800">
                      Reserve price is set based on your vehicle valuation
                    </AlertDescription>
                    <p className="text-sm text-blue-700">
                      This price is calculated from your vehicle's valuation data and cannot be modified.
                    </p>
                  </div>
                </div>
              </Alert>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reservePrice" className="flex items-center gap-2">
                    Reserve Price (PLN)
                    <LockIcon className="h-4 w-4 text-gray-500" />
                  </Label>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Valuation-based
                  </Badge>
                </div>
                <Input
                  id="reservePrice"
                  value={formatCurrency(reservePrice)}
                  readOnly
                  disabled
                  className="bg-gray-50 border-gray-300 cursor-not-allowed text-gray-700 font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reserve price represents the minimum price your vehicle will sell for, calculated from your valuation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
};
