
/**
 * Changes made:
 * - 2024-09-05: Created DashboardHeader component from SellerDashboard refactoring
 * - 2024-10-19: Updated "Create New Listing" button to navigate to homepage for VIN check
 */

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  title: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export const DashboardHeader = ({ 
  title, 
  buttonLabel = "Create New Listing",
  buttonHref = "/"
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  
  const handleCreateListing = () => {
    // Navigate to homepage for VIN check instead of directly to sell-my-car
    navigate(buttonHref);
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-dark">{title}</h1>
      <Button 
        onClick={handleCreateListing} 
        className="bg-primary hover:bg-primary/90 text-white"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
};
