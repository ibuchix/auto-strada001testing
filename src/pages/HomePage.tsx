
/**
 * Created: 2024-08-20
 * Landing page for the application
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

const HomePage = () => {
  const navigate = useNavigate();
  const { session, isSeller } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-4xl font-bold text-[#DC143C] mb-6">Autostrada</h1>
      <p className="text-xl text-center mb-8 max-w-2xl">
        The fastest way to sell your car at the best price
      </p>
      
      {session ? (
        <div className="flex flex-col space-y-4 items-center">
          <Button 
            className="px-8 py-6 text-lg bg-[#DC143C] hover:bg-[#DC143C]/90"
            onClick={() => navigate('/seller-dashboard')}
          >
            Go to Dashboard
          </Button>
          
          {isSeller ? (
            <Button 
              variant="outline" 
              className="px-8 py-6 text-lg border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C]/10"
              onClick={() => navigate('/seller-form')}
            >
              Sell a Car
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="px-8 py-6 text-lg border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C]/10"
              onClick={() => navigate('/auth')}
            >
              Become a Seller
            </Button>
          )}
        </div>
      ) : (
        <Button 
          className="px-8 py-6 text-lg bg-[#DC143C] hover:bg-[#DC143C]/90"
          onClick={() => navigate('/auth')}
        >
          Sign In / Register
        </Button>
      )}
    </div>
  );
};

export default HomePage;
