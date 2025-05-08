
/**
 * Created: 2025-05-08
 * Simple 404 Not Found page for the seller side of the application
 */

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-dark mb-4">Page Not Found</h1>
        <p className="text-subtitle mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/dashboard/seller")}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Go to Seller Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10"
          >
            Back to Valuation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
