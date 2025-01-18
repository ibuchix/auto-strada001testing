import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, TrendingUp, Calendar, Gauge } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number;
    averagePrice?: number;
    isExisting?: boolean;
    error?: string;
  };
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry 
}: ValuationResultProps) => {
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = !!valuationResult.error;
  const hasValuation = !hasError && (valuationResult.valuation || valuationResult.averagePrice);
  const displayPrice = valuationResult.valuation || valuationResult.averagePrice || 0;

  if (hasError) {
    return (
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Valuation Error
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-subtitle">
            {valuationResult.error || "We couldn't get a valuation for your vehicle at this time."}
          </p>
          <p className="text-sm text-center text-subtitle">
            Please try again or enter your details manually.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
            >
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    );
  }

  const rawData = valuationResult.rawResponse?.functionResponse;
  const valuationDetails = rawData?.valuation?.calcValuation;
  const mileageImpact = rawData?.valuation?.calcNearOdometer?.values;
  const yearlyPrices = rawData?.valuation?.calcNearYear?.values;

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">
          {valuationResult.isExisting 
            ? "Similar Vehicle Found!" 
            : "Your Vehicle Valuation"
          }
        </DialogTitle>
      </DialogHeader>

      {valuationResult.isExisting && (
        <div className="bg-accent/50 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-subtitle">
              We found a similar vehicle in our system. Based on this, here's an estimated valuation for your car.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Manufacturer</p>
            <p className="font-medium text-dark">{valuationResult.make || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Model</p>
            <p className="font-medium text-dark">{valuationResult.model || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Year</p>
            <p className="font-medium text-dark">{valuationResult.year || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">VIN</p>
            <p className="font-medium text-dark">{valuationResult.vin}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Transmission</p>
            <p className="font-medium text-dark capitalize">{valuationResult.transmission || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Mileage</p>
            <p className="font-medium text-dark">{mileage.toLocaleString()} km</p>
          </div>
        </div>

        {hasValuation && (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
              <p className="text-sm text-subtitle mb-2">
                {valuationResult.isExisting 
                  ? "Estimated Value (Based on Similar Vehicle)" 
                  : "Estimated Market Value"
                }
              </p>
              <p className="text-4xl font-bold text-primary">
                PLN {displayPrice.toLocaleString()}
              </p>
              {valuationDetails && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-subtitle">Minimum</p>
                    <p className="font-medium">PLN {valuationDetails.price_min?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-subtitle">Maximum</p>
                    <p className="font-medium">PLN {valuationDetails.price_max?.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full">
              {mileageImpact && mileageImpact.length > 0 && (
                <AccordionItem value="mileage-impact">
                  <AccordionTrigger className="flex gap-2">
                    <Gauge className="h-4 w-4" />
                    Mileage Impact on Price
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {mileageImpact.map((impact, index) => (
                        <div 
                          key={index}
                          className={`flex justify-between p-2 rounded ${
                            impact.odometer_avr === rawData.userParams.odometer 
                              ? 'bg-primary/5' 
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <span>{impact.odometer_avr.toLocaleString()} km</span>
                          <span className="font-medium">
                            PLN {impact.price_avr.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {yearlyPrices && yearlyPrices.length > 0 && (
                <AccordionItem value="yearly-prices">
                  <AccordionTrigger className="flex gap-2">
                    <Calendar className="h-4 w-4" />
                    Price Trends by Year
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {yearlyPrices.map((yearData, index) => (
                        <div 
                          key={index}
                          className={`flex justify-between p-2 rounded ${
                            yearData.year === valuationResult.year 
                              ? 'bg-primary/5' 
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <span>{yearData.year}</span>
                          <span className="font-medium">
                            PLN {yearData.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="market-analysis">
                <AccordionTrigger className="flex gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Market Analysis
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <p className="text-sm text-subtitle mb-1">Sample Size</p>
                      <p className="font-medium text-dark">
                        {rawData?.valuation?.condition?.recordsNumber || 'N/A'} vehicles
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-subtitle mb-1">Average Price</p>
                        <p className="font-medium">
                          PLN {valuationDetails?.price_avr?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-subtitle mb-1">Median Price</p>
                        <p className="font-medium">
                          PLN {valuationDetails?.price_med?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        <Button 
          onClick={onContinue}
          className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
        >
          {valuationResult.isExisting 
            ? "List My Car" 
            : "List This Car"
          }
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};