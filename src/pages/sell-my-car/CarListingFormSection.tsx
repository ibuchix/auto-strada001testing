
/**
 * Fixed Car Listing Form Section
 * 
 * Changes:
 * - Added support for receiving car data from VIN check
 * - Improved initialization to use data from location state
 * - Enhanced error handling and logging
 * - Fixed form initialization to prevent constant reinitialization
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";

interface CarListingFormSectionProps {
  pageId: string;
  renderCount: number;
  fromValuation?: boolean;
}

export const CarListingFormSection = ({ 
  pageId, 
  renderCount,
  fromValuation = false
}: CarListingFormSectionProps) => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check for car data from VIN check in location state
  useEffect(() => {
    if (isInitialized) return;
    
    const fromVinCheck = location.state?.fromVinCheck;
    const carData = location.state?.carData;
    
    if (fromVinCheck && carData) {
      console.log("Received car data from VIN check:", {
        make: carData.make,
        model: carData.model,
        year: carData.year,
        vin: carData.vin,
        hasValuation: !!carData.valuation,
        hasReservePrice: !!carData.reservePrice
      });
      
      // Store car data in sessionStorage as backup
      sessionStorage.setItem('carDataFromVinCheck', JSON.stringify(carData));
      
      toast.success("Vehicle details loaded", {
        description: `${carData.year} ${carData.make} ${carData.model}`,
        duration: 3000
      });
    } else {
      // Check if we have car data in sessionStorage (fallback)
      const storedCarData = sessionStorage.getItem('carDataFromVinCheck');
      
      if (storedCarData) {
        try {
          const parsedData = JSON.parse(storedCarData);
          console.log("Using car data from sessionStorage:", {
            make: parsedData.make,
            model: parsedData.model,
            year: parsedData.year
          });
          
          toast.info("Using previously validated vehicle", {
            description: `${parsedData.year} ${parsedData.make} ${parsedData.model}`,
            duration: 3000
          });
        } catch (error) {
          console.error("Error parsing stored car data:", error);
        }
      }
    }
    
    setIsInitialized(true);
  }, [location.state, isInitialized]);

  return (
    <PageLayout>
      <div className="pb-20">
        <h1 className="text-3xl font-bold mb-6">List Your Car</h1>
        <p className="text-gray-600 mb-8">
          {location.state?.fromVinCheck 
            ? "We've prepared your car listing based on the valuation data. Please complete the form to list your car."
            : "Please fill out this form to list your car for auction."
          }
        </p>
        <CarListingForm />
      </div>
    </PageLayout>
  );
};

