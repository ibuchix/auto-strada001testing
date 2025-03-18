
/**
 * Changes made:
 * - 2024-08-22: Created DashboardHeader component from SellerDashboard refactoring
 */

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export const DashboardHeader = ({ 
  title, 
  buttonLabel = "Create New Listing",
  buttonHref = "/sell-my-car"
}: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-dark">{title}</h1>
      <Button 
        onClick={() => window.location.href = buttonHref} 
        className="bg-primary hover:bg-primary/90 text-white"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
};
