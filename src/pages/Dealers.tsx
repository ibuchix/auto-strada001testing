import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

// This will be updated with your new dealer platform URL once created
const DEALER_PLATFORM_URL = "https://your-dealer-platform-url.com";

const Dealers = () => {
  const handleDealerAccess = () => {
    try {
      window.open(DEALER_PLATFORM_URL, '_blank');
    } catch (error) {
      console.error('Error accessing dealer platform:', error);
      toast({
        title: "Error",
        description: "Failed to access dealer platform. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-secondary mb-6 font-kanit">
            Auto-Strada Dealer Platform
          </h1>
          
          <p className="text-subtitle mb-8">
            Access our dedicated platform for automotive dealers to bid on and acquire vehicles.
          </p>

          <Button 
            onClick={handleDealerAccess}
            className="bg-primary hover:bg-primary/90 text-white font-kanit"
          >
            Access Dealer Platform
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dealers;