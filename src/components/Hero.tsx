import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const Hero = () => {
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

      // Store the car data in Supabase
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
          // Set reasonable defaults for required fields
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
    <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[#f3f3f3]">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-secondary/20" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 max-w-4xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-primary">Sell</span> your car with ease
          </h1>
          <p className="text-xl text-subtitle mb-8">
            We have certified dealers who are ready to give<br />
            you their best price
          </p>
          
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

          <div className="mt-12">
            <p className="text-sm text-secondary mb-2">WERYFIKACJA Z:</p>
            <img
              src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png"
              alt="CarVertical"
              className="h-8 mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};