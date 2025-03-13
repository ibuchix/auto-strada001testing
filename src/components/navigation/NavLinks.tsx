
/**
 * Changes made:
 * - 2024-03-19: Removed Partners link from navigation
 * - 2024-06-30: Added specific link for seller dashboard when logged in as a seller
 * - 2024-07-01: Removed Dealers link and reorganized navigation items per new requirements
 * - 2024-07-02: Fixed Dashboard link appearance in navigation
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface NavLinksProps {
  userRole: string | null;
  onSignOut: () => Promise<void>;
  session: boolean;
}

export const NavLinks = ({ userRole, onSignOut, session }: NavLinksProps) => {
  return (
    <>
      {session && userRole && (
        <Link 
          to={`/dashboard/${userRole}`} 
          className="text-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
      )}
      <Link to="/sellers" className="text-secondary hover:text-primary transition-colors">
        Sellers
      </Link>
      <Link to="/faq" className="text-secondary hover:text-primary transition-colors">
        FAQ
      </Link>
      {session ? (
        <Button 
          variant="outline" 
          className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          onClick={onSignOut}
        >
          Sign Out
        </Button>
      ) : (
        <Link to="/auth">
          <Button 
            variant="outline" 
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Sign In
          </Button>
        </Link>
      )}
    </>
  );
};
