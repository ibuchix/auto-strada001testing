import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ValuationForm = () => {
  const [registration, setRegistration] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registration) {
      toast.error("Please enter your registration number");
      return;
    }

    setIsLoading(true);

    try {
      const { data: valuationData, error: valuationError } = await supabase.functions.invoke('get-car-valuation', {
        body: { registration }
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
        registration: registration,
        valuation: valuationData.valuation || 0,
        timestamp: new Date().toISOString()
      };

      // Store in localStorage
      const previousValuations = JSON.parse(localStorage.getItem('carValuations') || '[]');
      previousValuations.unshift(valuationResult);
      localStorage.setItem('carValuations', JSON.stringify(previousValuations.slice(0, 5))); // Keep last 5 valuations

      toast.success("Vehicle valuation completed successfully!");
      setRegistration("");
      
    } catch (error) {
      console.error('Valuation error:', error);
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleValuation} className="space-y-4 max-w-sm mx-auto">
      <Input
        type="text"
        placeholder="ENTER REG"
        value={registration}
        onChange={(e) => setRegistration(e.target.value)}
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
  );
};