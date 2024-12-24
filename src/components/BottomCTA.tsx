import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const BottomCTA = () => {
  const [vin, setVin] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin) {
      navigate('/sell-my-car', { state: { vin } });
    }
  };

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-12">What are you waiting for?</h2>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <Input
            type="text"
            placeholder="ENTER VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            className="h-14 text-center text-lg border-2 border-secondary bg-white placeholder:text-secondary rounded-none"
          />
          <Button 
            type="submit"
            className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-none flex items-center justify-center gap-2"
          >
            VALUE YOUR CAR
            <ChevronRight className="w-6 h-6" />
          </Button>
        </form>
      </div>
    </section>
  );
};