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
 * - 2025-05-31: Added direct localStorage access to bypass navigation issues
 * - 2025-06-09: Improved reserve price handling from valuation data
 * - 2025-06-14: Enhanced reserve price extraction from valuation data
 */
import { useEffect, useState, useRef, useMemo } from "react";
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
  // Generate a unique component ID for logging
  const componentId = useMemo(() => pageId || Math.random().toString(36).substring(2, 8), [pageId]);
  // Use a ref to track if initialization has happened to prevent re-renders
  const initializeAttemptedRef = useRef(false);
  const dataLoadedRef = useRef(false);
  // Force render timer reference
  const forceRenderTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for car data from VIN check or valuation in location state - run once only
  useEffect(() => {
    // Skip if already initialized or if initialization was attempted
    if (isInitialized || initializeAttemptedRef.current) return;
    
    // Mark as attempted to prevent re-running this effect
    initializeAttemptedRef.current = true;
    
    console.log(`CarListingFormSection[${componentId}]: Initializing component`, { 
      pageId, 
      renderCount, 
      fromValuation,
      forceReady,
      locationState: location.state ? Object.keys(location.state) : 'none'
    });
    
    // If not initialized after 2 seconds, force render
    forceRenderTimerRef.current = setTimeout(() => {
      console.log(`CarListingFormSection[${componentId}]: Force initialization after timeout`);
      setIsInitialized(true);
      
      // Show toast to indicate we're trying to recover
      if (!dataLoadedRef.current) {
        toast.info("Loading form", { 
          description: "Preparing the vehicle listing form..." 
        });
      }
    }, 2000);
    
    // Prioritize data sources - first location.state, then localStorage
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
              localStorage.setItem('tempReservePrice', reservePrice?.toString() || '');
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
        source: fromVinCheck ? "VIN Check" : "Unknown"
      });
      
      // Store car data as backup
      try {
        // Store both original and as individual values for more reliable access
        sessionStorage.setItem('carDataFromVinCheck', JSON.stringify(carData));
        
        // Store individual keys for direct access if needed
        if (carData.make) localStorage.setItem('tempMake', carData.make);
        if (carData.model) localStorage.setItem('tempModel', carData.model);
        if (carData.year) localStorage.setItem('tempYear', carData.year.toString());
        if (carData.vin) localStorage.setItem('tempVIN', carData.vin);
        if (carData.mileage) localStorage.setItem('tempMileage', carData.mileage.toString());
        if (carData.transmission) localStorage.setItem('tempGearbox', carData.transmission);
        
        // Make sure reserve price is stored separately for reliable access
        if (carData.reservePrice || carData.valuation) {
          const reservePrice = carData.reservePrice || carData.valuation;
          localStorage.setItem('tempReservePrice', reservePrice.toString());
          console.log(`CarListingFormSection[${componentId}]: Stored reserve price: ${reservePrice}`);
        }
        
        console.log(`CarListingFormSection[${componentId}]: Saved car data to storage for backup`);
        dataLoadedRef.current = true;
      } catch (error) {
        console.error(`CarListingFormSection[${componentId}]: Error saving to storage:`, error);
      }
      
      // Show a toast notification for better UX - only once
      toast.success("Vehicle details loaded", {
        description: `${carData.year} ${carData.make} ${carData.model}`,
        duration: 3000
      });
    } else {
      console.log(`CarListingFormSection[${componentId}]: No car data found from any source`);
      
      // Check if we can piece together data from individual storage items
      try {
        const tempMake = localStorage.getItem('tempMake');
        const tempModel = localStorage.getItem('tempModel');
        const tempYear = localStorage.getItem('tempYear');
        const tempVIN = localStorage.getItem('tempVIN');
        
        if (tempMake && tempModel && tempVIN) {
          console.log(`CarListingFormSection[${componentId}]: Found individual car data in localStorage`);
          dataLoadedRef.current = true;
        }
      } catch (e) {
        // Ignore storage access errors
      }
    }
    
    // Set initialization complete
    setIsInitialized(true);
    
    // Clean up timer
    return () => {
      if (forceRenderTimerRef.current) {
        clearTimeout(forceRenderTimerRef.current);
      }
    };
  }, [location.state, pageId, renderCount, fromValuation, componentId, forceReady]);

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
