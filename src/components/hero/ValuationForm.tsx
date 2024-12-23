import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ValuationForm = () => {
  const [vin, setVin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vin) {
      toast.error("Please enter your vehicle's VIN number");
      return;
    }

    setIsLoading(true);

    try {
      const { data: valuationData, error: valuationError } = await supabase.functions.invoke('get-car-valuation', {
        body: { registration: vin } // keeping registration as the key for backend compatibility
      });

      if (valuationError) throw valuationError;

      if (!valuationData) {
        throw new Error('No data received from valuation service');
      }

      // Store the valuation data in localStorage instead of the database for anonymous users
      const valuationResult = {
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        vin: vin,
        valuation: valuationData.valuation || 0,
        timestamp: new Date().toISOString()
      };

      // Store in localStorage
      const previousValuations = JSON.parse(localStorage.getItem('carValuations') || '[]');
      previousValuations.unshift(valuationResult);
      localStorage.setItem('carValuations', JSON.stringify(previousValuations.slice(0, 5))); // Keep last 5 valuations

      setValuationResult(valuationResult);
      setShowDialog(true);
      toast.success("Vehicle valuation completed successfully!");
      setVin("");
      
    } catch (error) {
      console.error('Valuation error:', error);
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleValuation} className="space-y-4 max-w-sm mx-auto">
        <Input
          type="text"
          placeholder="ENTER VIN"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          className="h-12 text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-md flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? "GETTING VALUATION..." : "VALUE YOUR CAR"}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </form>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Vehicle Valuation</DialogTitle>
          </DialogHeader>
          {valuationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-subtitle">Make</p>
                  <p className="font-medium">{valuationResult.make}</p>
                </div>
                <div>
                  <p className="text-sm text-subtitle">Model</p>
                  <p className="font-medium">{valuationResult.model}</p>
                </div>
                <div>
                  <p className="text-sm text-subtitle">Year</p>
                  <p className="font-medium">{valuationResult.year}</p>
                </div>
                <div>
                  <p className="text-sm text-subtitle">VIN</p>
                  <p className="font-medium">{valuationResult.vin}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-subtitle mb-1">Estimated Value</p>
                <p className="text-2xl font-bold text-primary">
                  £{valuationResult.valuation.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};