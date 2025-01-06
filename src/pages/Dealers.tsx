import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEALER_WEBAPP_URL = process.env.NODE_ENV === 'development' 
  ? "http://localhost:8080"
  : "https://aukcja.auto-strada.pl";

const Dealers = () => {
  const handleDealerAccess = () => {
    try {
      window.open(DEALER_WEBAPP_URL, '_blank');
    } catch (error) {
      console.error('Error accessing dealer platform:', error);
      toast.error("Failed to access dealer platform. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-[#383B39] mb-6">
            Auto-Strada Dealer Platform
          </h1>
          
          <p className="text-[#6A6A77] mb-8">
            Access our dedicated platform for automotive dealers to bid on and acquire vehicles.
          </p>

          <Button 
            onClick={handleDealerAccess}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
          >
            Access Dealer Platform
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dealers;