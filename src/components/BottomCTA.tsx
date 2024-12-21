import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";

export const BottomCTA = () => {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-12">What are you waiting for?</h2>
        <div className="max-w-md mx-auto space-y-4">
          <Input
            type="text"
            placeholder="ENTER REG"
            className="h-14 text-center text-lg border-2 border-[#333333] bg-white placeholder:text-[#333333] rounded-none"
          />
          <Button 
            className="w-full h-14 bg-[#333333] hover:bg-[#444444] text-white text-lg rounded-none flex items-center justify-center gap-2"
          >
            VALUE YOUR CAR
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </section>
  );
};