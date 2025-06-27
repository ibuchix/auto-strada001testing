
/**
 * Changes made:
 * - 2025-06-14: Removed Dealers, Sellers, About, SellMyCar and Terms navigation links for seller-side only
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
