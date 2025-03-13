
/**
 * Changes made:
 * - 2024-06-30: Added component comment for clarity
 * - 2024-06-30: Updated to properly display seller dashboard link on mobile
 */

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NavLinks } from "./NavLinks";

interface MobileNavProps {
  userRole: string | null;
  onSignOut: () => Promise<void>;
  session: boolean;
}

export const MobileNav = ({ userRole, onSignOut, session }: MobileNavProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col space-y-4 mt-8">
          <NavLinks userRole={userRole} onSignOut={onSignOut} session={session} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
