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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f3f3f3]">
      {/* Red Triangle */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-[#ea384c] transform -skew-x-12 -translate-x-16 -translate-y-16">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-30">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>
      </div>
      
      {/* Gray Triangle */}
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#333333] transform skew-x-12 translate-x-16 translate-y-16" />
      
      {/* Car Image */}
      <div className="absolute bottom-0 right-0 w-1/2">
        <img
          src="/lovable-uploads/159a3fac-5452-46dd-bc62-84ed729108f8.png"
          alt="Featured Car"
          className="w-full h-auto object-contain"
        />
      </div>
      
      {/* Content */}
      <div className="container relative z-10 max-w-4xl mx-auto px-4">
        <div className="text-left max-w-2xl">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-[#ea384c]">Sell</span> your car with ease
          </h1>
          <p className="text-xl text-[#333333] mb-8">
            We have certified dealers who are ready to give<br />
            you their best price
          </p>
          
          <form onSubmit={handleValuation} className="space-y-4 max-w-md">
            <Input
              type="text"
              placeholder="ENTER REG"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="h-14 text-center text-lg border-2 border-[#333333] bg-white placeholder:text-[#333333] rounded-none"
            />
            <Button 
              type="submit" 
              className="w-full h-14 bg-[#333333] hover:bg-[#444444] text-white text-lg rounded-none flex items-center justify-center gap-2"
            >
              VALUE YOUR CAR
              <ChevronRight className="w-6 h-6" />
            </Button>
          </form>

          {/* CarVertical Logo */}
          <div className="mt-12">
            <p className="text-sm text-[#333333] mb-2">WERYFIKACJA Z:</p>
            <img
              src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png"
              alt="CarVertical"
              className="h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};