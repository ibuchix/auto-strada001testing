import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import { SellerFormProps } from "./types";

export const HeroSection = ({ 
  vin, 
  mileage, 
  gearbox,
  isLoading,
  onVinChange, 
  onMileageChange, 
  onGearboxChange, 
  onSubmit 
}: SellerFormProps) => {
  return (
    <section className="pt-32 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent to-transparent -skew-y-6 transform origin-top-left" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Sell your car in <span className="text-primary">3 simple steps</span>
          </h1>
          <p className="text-xl text-subtitle mb-8">
            Get the best price for your car without the hassle of private buyers or low-ball offers
          </p>
          <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-4">
            <Input
              type="text"
              placeholder="Enter your VIN number"
              value={vin}
              onChange={onVinChange}
              className="h-12 text-center text-lg"
              disabled={isLoading}
            />
            <Input
              type="number"
              placeholder="Enter mileage (KM)"
              value={mileage}
              onChange={onMileageChange}
              className="h-12 text-center text-lg"
              min="0"
              disabled={isLoading}
            />
            <div className="bg-white border-2 border-secondary/20 rounded-md p-4">
              <RadioGroup
                value={gearbox}
                onValueChange={onGearboxChange}
                className="flex gap-6 justify-center"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-medium cursor-pointer">Manual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="automatic" id="automatic" />
                  <Label htmlFor="automatic" className="font-medium cursor-pointer">Automatic</Label>
                </div>
              </RadioGroup>
            </div>
            <Button 
              type="submit"
              className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Selling
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};