import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const ValuationForm = () => {
  const [registration, setRegistration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const handleValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registration) {
      toast.error("Please enter your registration number");
      return;
    }

    if (!session?.user) {
      toast.error("Please sign in to get a valuation");
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

      const { error: insertError } = await supabase
        .from('cars')
        .insert({
          seller_id: session.user.id,
          title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
          registration_number: registration,
          make: valuationData.make,
          model: valuationData.model,
          year: valuationData.year,
          valuation_data: valuationData,
          vin: valuationData.vin || 'PENDING',
          mileage: 0,
          price: valuationData.valuation || 0
        });

      if (insertError) throw insertError;

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