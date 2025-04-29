
/**
 * Navigation component
 * Updated: 2025-04-29 - Fixed auth hook usage and component prop types
 * Updated: 2025-05-04 - Removed diagnostic and valuation test links
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/navigation/NavLinks";
import { MobileNav } from "@/components/navigation/MobileNav";
import { useAuth } from "@/components/AuthProvider";

export const Navigation = () => {
  const { session, isSeller, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Determine user role from session metadata or isSeller
  const userRole = session?.user?.user_metadata?.role || (isSeller ? 'seller' : null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-[#DC143C]">Autostrada</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <NavLinks 
            userRole={userRole}
            onSignOut={signOut}
            session={!!session} 
          />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600"
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <MobileNav 
          userRole={userRole} 
          onSignOut={signOut} 
          session={!!session} 
        />
      )}
    </nav>
  );
}
