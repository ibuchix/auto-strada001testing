import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png" alt="Auto-Strada Logo" className="h-8" />
            <span className="text-xl font-bold text-primary">Auto-Strada</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/sellers" className="text-secondary hover:text-primary transition-colors">
              Sellers
            </Link>
            <Link to="/dealers" className="text-secondary hover:text-primary transition-colors">
              Dealers
            </Link>
            <Link to="/faq" className="text-secondary hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link to="/partners" className="text-secondary hover:text-primary transition-colors">
              Partners
            </Link>
            <Button 
              variant="outline" 
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};