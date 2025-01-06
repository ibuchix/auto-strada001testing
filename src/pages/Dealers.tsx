import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const DEALER_WEBAPP_URL = "http://localhost:8080/dashboard";

const Dealers = () => {
  const { toast } = useToast();

  const handleDealerRedirect = () => {
    try {
      console.log('Attempting to redirect to dealer platform:', DEALER_WEBAPP_URL); // Debug log
      const newWindow = window.open(DEALER_WEBAPP_URL, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        toast({
          title: "Success",
          description: "Opening dealer platform in a new tab",
        });
      } else {
        toast({
          title: "Error",
          description: "Please allow pop-ups to access the dealer platform",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error redirecting to dealer webapp:', error);
      toast({
        title: "Error",
        description: "Failed to open dealer platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-secondary mb-6 font-kanit">
            Auto-Strada Dealer Platform
          </h1>
          <p className="text-subtitle mb-8">
            Access our dedicated platform for automotive dealers to participate in auctions,
            manage inventory, and grow your business.
          </p>
          <div className="space-y-4">
            <Button
              onClick={handleDealerRedirect}
              className="bg-primary text-white hover:bg-primary/90 w-full md:w-auto font-kanit"
            >
              Access Dealer Platform
            </Button>
            <div className="text-subtitle mt-4">
              New to Auto-Strada?{" "}
              <Link to="/dealer-signup" className="text-iris hover:underline">
                Register as a Dealer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dealers;