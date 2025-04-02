
/**
 * Custom hooks for sidebar functionality
 */
import React from "react";
import { SidebarContext } from "./types";

// Create context
const SidebarContextObject = React.createContext<SidebarContext | null>(null);

/**
 * Hook to use sidebar context
 */
export function useSidebar() {
  const context = React.useContext(SidebarContextObject);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

// Export for provider usage
export { SidebarContextObject };
