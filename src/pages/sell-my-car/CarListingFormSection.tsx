
/**
 * Fixed Car Listing Form Section
 * 
 * Changes:
 * - Added support for receiving car data from VIN check
 * - Improved initialization to use data from location state
 * - Enhanced error handling and logging
 * - Fixed form initialization to prevent constant reinitialization
 * - 2025-05-28: Fixed valuation data handling and loading flow
 * - 2025-05-29: Fixed infinite re-render by adding useRef to track initialization
 * - 2025-05-30: Added force render mechanism to prevent stuck state
 */
import { useEffect, useState, useRef } from "react";
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
  // Use a ref to track if initialization has happened to prevent re-renders
  const initializeAttemptedRef = useRef(false);
  // Force render timer reference
  const forceRenderTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for car data from VIN check or valuation in location state - run once only
  useEffect(() => {
    // Skip if already initialized or if initialization was attempted
    if (isInitialized || initializeAttemptedRef.current) return;
    
    // Mark as attempted to prevent re-running this effect
    initializeAttemptedRef.current = true;
    
    console.log("CarListingFormSection: Initializing component", { 
      pageId, 
      renderCount, 
      fromValuation,
      locationState: location.state
    });
    
    // If not initialized after 3 seconds, force render
    forceRenderTimerRef.current = setTimeout(() => {
      console.log("CarListingFormSection: Force initialization after timeout");
      setIsInitialized(true);
    }, 3000);
    
    // Prioritize data sources - first location.state, then sessionStorage
    const fromVinCheck = location.state?.fromVinCheck || location.state?.fromValuation;
    let carData = location.state?.carData || location.state?.valuationData;
    
    // If no direct data in state, try to get from storage
    if (!carData) {
      try {
        // Try to get from localStorage first (for valuation data)
        const storedValuationData = localStorage.getItem('valuationData');
        if (storedValuationData) {
          console.log("CarListingFormSection: Found valuationData in localStorage");
          carData = JSON.parse(storedValuationData);
        }
        
        // Fallback to sessionStorage (for VIN check data)
        if (!carData) {
          console.log("CarListingFormSection: Checking sessionStorage for carDataFromVinCheck");
          const storedCarData = sessionStorage.getItem('carDataFromVinCheck');
          if (storedCarData) {
            carData = JSON.parse(storedCarData);
          }
        }
      } catch (error) {
        console.error("CarListingFormSection: Error parsing stored car data:", error);
      }
    }
    
    if (carData) {
      console.log("CarListingFormSection: Car data available for form initialization:", {
        make: carData.make,
        model: carData.model,
        year: carData.year,
        vin: carData.vin,
        mileage: carData.mileage,
        hasValuation: !!carData.valuation || !!carData.reservePrice,
        source: fromVinCheck ? "VIN Check" : "Unknown"
      });
      
      // Store car data as backup
      try {
        sessionStorage.setItem('carDataFromVinCheck', JSON.stringify(carData));
        console.log("CarListingFormSection: Saved car data to sessionStorage for backup");
      } catch (error) {
        console.error("CarListingFormSection: Error saving to sessionStorage:", error);
      }
      
      // Show a toast notification for better UX - only once
      toast.success("Vehicle details loaded", {
        description: `${carData.year} ${carData.make} ${carData.model}`,
        duration: 3000
      });
    } else {
      console.log("CarListingFormSection: No car data found from any source");
    }
    
    // Set initialization complete
    setIsInitialized(true);
    
    // Clean up timer
    return () => {
      if (forceRenderTimerRef.current) {
        clearTimeout(forceRenderTimerRef.current);
      }
    };
  }, [location.state, pageId, renderCount, fromValuation]);

  return (
    <PageLayout>
      <div className="pb-20">
        <h1 className="text-3xl font-bold mb-6">List Your Car</h1>
        <p className="text-gray-600 mb-8">
          {location.state?.fromVinCheck || location.state?.fromValuation
            ? "We've prepared your car listing based on the valuation data. Please complete the form to list your car."
            : "Please fill out this form to list your car for auction."
          }
        </p>
        <CarListingForm key={`form-${isInitialized ? 'ready' : 'loading'}-${renderCount}`} />
      </div>
    </PageLayout>
  );
};
