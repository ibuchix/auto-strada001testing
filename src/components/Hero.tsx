import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const carImages = [
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200",
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1200"
];

export const Hero = () => {
  const [registration, setRegistration] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleValuation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) {
      toast.error("Please enter your registration number");
      return;
    }
    toast.success("Getting your car details...");
  };

  // Change image every 5 seconds
  setTimeout(() => {
    setCurrentImageIndex((prev) => (prev + 1) % carImages.length);
  }, 5000);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={carImages[currentImageIndex]}
          alt="Featured Car"
          className="w-full h-full object-cover transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      <div className="container relative z-10 text-white text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
          Sell Your Car in Minutes
        </h1>
        <p className="text-xl md:text-2xl mb-8 animate-fade-in">
          Get an instant valuation and sell your car hassle-free
        </p>
        
        <form onSubmit={handleValuation} className="max-w-md mx-auto">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter registration"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="bg-white/90 text-black placeholder:text-gray-500"
            />
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Get Value
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};