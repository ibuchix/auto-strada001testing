
/**
 * Changes made:
 * - 2025-06-14: Removed references to deleted pages in mobile navigation
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
