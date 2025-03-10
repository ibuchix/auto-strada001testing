
/**
 * Changes made:
 * - 2024-03-19: Removed Partners link from navigation
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NavLinksProps {
  userRole: string | null;
  onSignOut: () => Promise<void>;
  session: boolean;
}

export const NavLinks = ({ userRole, onSignOut, session }: NavLinksProps) => {
  return (
    <>
      <Link to="/sellers" className="text-secondary hover:text-primary transition-colors">
        Sellers
      </Link>
      <Link to="/dealers" className="text-secondary hover:text-primary transition-colors">
        Dealers
      </Link>
      <Link to="/faq" className="text-secondary hover:text-primary transition-colors">
        FAQ
      </Link>
      {session ? (
        <>
          {userRole && (
            <Link 
              to={`/dashboard/${userRole}`} 
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Dashboard
            </Link>
          )}
          <Button 
            variant="outline" 
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            onClick={onSignOut}
          >
            Sign Out
          </Button>
        </>
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
