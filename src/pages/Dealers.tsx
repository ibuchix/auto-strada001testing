import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DEALER_WEBAPP_URL = "https://aukcja.auto-strada.pl";

const Dealers = () => {
  const handleDealerRedirect = () => {
    try {
      console.log('Redirecting to dealer platform...'); // Debug log
      window.open(DEALER_WEBAPP_URL, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error redirecting to dealer webapp:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-secondary mb-6">
            Auto-Strada Dealer Platform
          </h1>
          <p className="text-subtitle mb-8">
            Access our dedicated platform for automotive dealers to participate in auctions,
            manage inventory, and grow your business.
          </p>
          <div className="space-y-4">
            <Button
              onClick={handleDealerRedirect}
              className="bg-primary text-white hover:bg-primary/90 w-full md:w-auto"
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