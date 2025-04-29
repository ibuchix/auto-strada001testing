
/**
 * Changes made:
 * - 2024-06-30: Added component comment for clarity
 * - 2024-06-30: Updated to properly display seller dashboard link on mobile
 * - 2024-07-01: Removed Dealers link and simplified mobile navigation per new requirements
 * - 2024-07-02: Fixed Dashboard link appearance in mobile navigation
 * - 2025-04-29: Updated props to match NavLinks component requirements
 */

import { NavLinks } from "./NavLinks";

interface MobileNavProps {
  userRole: string | null;
  onSignOut: () => Promise<void>;
  session: boolean;
}

export const MobileNav = ({ userRole, onSignOut, session }: MobileNavProps) => {
  return (
    <div className="bg-white border-t border-gray-200 py-4 px-4 md:hidden">
      <div className="flex flex-col space-y-4">
        <NavLinks 
          userRole={userRole} 
          onSignOut={onSignOut} 
          session={session} 
        />
      </div>
    </div>
  );
};
