import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
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
  // VIN validation
  const isValidVin = (vin: string) => {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
  };

  // Mileage validation
  const isValidMileage = (mileage: string) => {
    const mileageNum = Number(mileage);
    return !isNaN(mileageNum) && mileageNum > 0 && mileageNum < 1000000;
  };

  const vinError = vin && !isValidVin(vin) ? "Please enter a valid 17-character VIN" : "";
  const mileageError = mileage && !isValidMileage(mileage) ? "Please enter a valid mileage between 0 and 1,000,000 km" : "";

  const isFormValid = isValidVin(vin) && isValidMileage(mileage);

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
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your VIN number"
                value={vin}
                onChange={(e) => onVinChange(e)}
                className={`h-12 text-center text-lg ${vinError ? 'border-primary' : 'border-secondary/20'}`}
                disabled={isLoading}
                maxLength={17}
              />
              {vinError && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{vinError}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Enter mileage (KM)"
                value={mileage}
                onChange={(e) => onMileageChange(e)}
                className={`h-12 text-center text-lg ${mileageError ? 'border-primary' : 'border-secondary/20'}`}
                min="0"
                max="1000000"
                disabled={isLoading}
              />
              {mileageError && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{mileageError}</span>
                </div>
              )}
            </div>

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
              disabled={isLoading || !isFormValid}
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