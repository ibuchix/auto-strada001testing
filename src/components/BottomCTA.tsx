
/**
 * Bottom CTA component for VIN entry and navigation to valuation.
 * 2025-06-15: Fixed to properly return JSX instead of void to resolve usage as a JSX component.
 */
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
    <section className="w-full bg-primary py-8 mt-10 flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-center gap-4 w-full max-w-xl px-4"
      >
        <Input
          className="w-full text-lg"
          type="text"
          name="vin"
          value={vin}
          onChange={e => setVin(e.target.value)}
          placeholder="Enter your VIN to check your vehicle value"
          autoFocus={isMobile}
          maxLength={32}
          disabled={isOffline}
        />
        <Button
          type="submit"
          size="lg"
          className="flex items-center gap-2 md:min-w-[150px]"
          disabled={isOffline}
        >
          {isOffline
            ? (<><WifiOff className="mr-2 h-5 w-5" /> Offline</>)
            : (<><span>Get Valuation</span><ChevronRight className="h-5 w-5" /></>)
          }
        </Button>
      </form>
      <p className="mt-4 text-white/90 text-center text-sm max-w-xl">
        Check your vehicle’s value instantly before listing your car for sale.
      </p>
    </section>
  );
};
