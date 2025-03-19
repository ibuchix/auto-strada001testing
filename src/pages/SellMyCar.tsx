
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of sell my car page
 * - 2024-03-19: Added authentication check
 * - 2024-03-19: Implemented form integration
 * - 2024-06-07: Updated to use refactored form components
 * - 2024-10-19: Added validation to ensure VIN check was performed before accessing page
 * - 2024-11-11: Fixed issue with data validation that prevented form display
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SellMyCar = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!session) {
      toast.error("Please sign in to create a listing");
      navigate("/auth");
      return;
    }
    
    // Check if VIN check was performed
    const tempVIN = localStorage.getItem("tempVIN");
    const tempMileage = localStorage.getItem("tempMileage");
    
    try {
      // Try to get valuation data
      const valuationDataStr = localStorage.getItem("valuationData");
      const valuationData = valuationDataStr ? JSON.parse(valuationDataStr) : null;
      
      // Validate that we have the minimum required data
      if (!tempVIN || !tempMileage || !valuationData) {
        console.error("Missing data:", { tempVIN, tempMileage, valuationData });
        toast.error("Please complete a vehicle valuation first");
        navigate("/");
        return;
      }
      
      // All checks passed, form is valid to display
      setIsValid(true);
      
    } catch (error) {
      console.error("Error parsing valuation data:", error);
      toast.error("Invalid vehicle data. Please try valuation again.");
      navigate("/");
    }
  }, [session, navigate]);

  if (!session || !isValid) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          List Your Car
        </h1>
        <div className="max-w-2xl mx-auto">
          <CarListingForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellMyCar;
