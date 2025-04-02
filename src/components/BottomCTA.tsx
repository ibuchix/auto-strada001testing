
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { CACHE_KEYS, saveToCache, getFromCache } from "@/services/offlineCacheService";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export const BottomCTA = () => {
  const [vin, setVin] = useState("");
  const navigate = useNavigate();
  const { isOffline } = useOfflineStatus();
  const isMobile = useIsMobile();

  // Load from cache if available
  useEffect(() => {
    try {
      const cachedVin = getFromCache<string>(CACHE_KEYS.TEMP_VIN, "");
      if (cachedVin) {
        setVin(cachedVin);
      }
    } catch (error) {
      console.error("Failed to load cached VIN:", error);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vin.trim()) {
      toast.error("Please enter a VIN number");
      return;
    }
    
    // Save to cache using the improved function that properly handles strings
    saveToCache(CACHE_KEYS.TEMP_VIN, vin);
    
    if (isOffline) {
      toast.info("You're currently offline", {
        description: "Your VIN has been saved and will be processed when you're back online.",
        duration: 5000
      });
      return;
    }
    
    // Navigate to valuation page to properly process the VIN
    navigate('/', { state: { directValuation: true } });
  };

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4 text-center">
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-12`}>What are you waiting for?</h2>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <Input
            type="text"
            placeholder="ENTER VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            className={`${isMobile ? 'h-16' : 'h-14'} text-center text-lg border-2 border-secondary bg-white placeholder:text-secondary rounded-none`}
          />
          <Button 
            type="submit"
            className={`w-full ${isMobile ? 'h-16' : 'h-14'} bg-secondary hover:bg-secondary/90 text-white text-lg rounded-none flex items-center justify-center gap-2`}
            disabled={!vin.trim()}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-5 h-5 mr-2" />
                SAVE VIN (OFFLINE)
              </>
            ) : (
              <>
                VALUE YOUR CAR
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};
