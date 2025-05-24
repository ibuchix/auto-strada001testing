
/**
 * Fixed Car Listing Form Section
 * 
 * Changes:
 * - 2025-05-24: REMOVED ALL DRAFT LOGIC - Only handles immediate listing creation
 * - 2025-05-24: Simplified form initialization and removed unnecessary complexity
 * - 2025-05-24: Enhanced valuation data preservation through localStorage
 */
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";

interface CarListingFormSectionProps {
  pageId: string;
  renderCount: number;
  fromValuation?: boolean;
  forceReady?: boolean;
}

export const CarListingFormSection = ({ 
  pageId, 
  renderCount,
  fromValuation = false,
  forceReady = false
}: CarListingFormSectionProps) => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const componentId = useMemo(() => pageId || Math.random().toString(36).substring(2, 8), [pageId]);
  
  useEffect(() => {
    if (isInitialized) return;
    
    console.log(`CarListingFormSection[${componentId}]: Initializing component`, { 
      pageId, 
      renderCount, 
      fromValuation,
      forceReady,
      locationState: location.state ? Object.keys(location.state) : 'none'
    });
    
    const timer = setTimeout(() => {
      console.log(`CarListingFormSection[${componentId}]: Initialization complete`);
      setIsInitialized(true);
    }, 100);
    
    // Handle data from VIN check or valuation
    const fromVinCheck = location.state?.fromVinCheck || location.state?.fromValuation;
    let carData = location.state?.carData || location.state?.valuationData;
    
    // If no direct data in state, try to get from storage
    if (!carData) {
      try {
        // Try to get from localStorage first (for valuation data)
        const storedValuationData = localStorage.getItem('valuationData');
        if (storedValuationData) {
          console.log(`CarListingFormSection[${componentId}]: Found valuationData in localStorage`);
          try {
            carData = JSON.parse(storedValuationData);
            
            // Ensure reserve_price is properly set
            if (carData && (carData.reservePrice || carData.valuation)) {
              const reservePrice = carData.reservePrice || carData.valuation;
              console.log(`CarListingFormSection[${componentId}]: Found reserve price: ${reservePrice}`);
            }
          } catch (parseError) {
            console.error(`CarListingFormSection[${componentId}]: Error parsing valuation data:`, parseError);
          }
        }
        
        // Fallback to sessionStorage (for VIN check data)
        if (!carData) {
          console.log(`CarListingFormSection[${componentId}]: Checking sessionStorage for carDataFromVinCheck`);
          const storedCarData = sessionStorage.getItem('carDataFromVinCheck');
          if (storedCarData) {
            try {
              carData = JSON.parse(storedCarData);
            } catch (parseError) {
              console.error(`CarListingFormSection[${componentId}]: Error parsing VIN check data:`, parseError);
            }
          }
        }
      } catch (error) {
        console.error(`CarListingFormSection[${componentId}]: Error accessing stored car data:`, error);
      }
    }
    
    if (carData) {
      console.log(`CarListingFormSection[${componentId}]: Car data available for form initialization:`, {
        make: carData.make,
        model: carData.model,
        year: carData.year,
        vin: carData.vin && carData.vin.substring(0, 4) + '...',
        mileage: carData.mileage,
        hasValuation: !!carData.valuation || !!carData.reservePrice,
        reservePrice: carData.reservePrice || carData.valuation,
        source: fromVinCheck ? "VIN Check" : "Valuation"
      });
      
      // Show a toast notification for better UX
      toast.success("Vehicle details loaded", {
        description: `${carData.year} ${carData.make} ${carData.model}`,
        duration: 3000
      });
    } else {
      console.log(`CarListingFormSection[${componentId}]: No car data found from any source`);
    }
    
    return () => clearTimeout(timer);
  }, [location.state, pageId, renderCount, fromValuation, componentId, forceReady, isInitialized]);

  return (
    <PageLayout>
      <div className="pb-20">
        <h1 className="text-3xl font-bold mb-6">List Your Car</h1>
        <p className="text-gray-600 mb-8">
          {location.state?.fromVinCheck || location.state?.fromValuation || fromValuation
            ? "We've prepared your car listing based on the valuation data. Please complete the form to list your car."
            : "Please fill out this form to list your car for auction."
          }
        </p>
        <CarListingForm 
          key={`form-${isInitialized ? 'ready' : 'loading'}-${renderCount}-${componentId}`} 
          fromValuation={fromValuation || !!location.state?.fromValuation}
        />
      </div>
    </PageLayout>
  );
};
