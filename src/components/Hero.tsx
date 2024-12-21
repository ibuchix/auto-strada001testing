import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

export const Hero = () => {
  const [registration, setRegistration] = useState("");

  const handleValuation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) {
      toast.error("Please enter your registration number");
      return;
    }
    toast.success("Getting your car details...");
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
            />
            <Button 
              type="submit" 
              className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-md flex items-center justify-center gap-2"
            >
              VALUE YOUR CAR
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