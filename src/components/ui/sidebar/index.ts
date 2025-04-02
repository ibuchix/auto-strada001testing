
/**
 * Main export file for all sidebar components
 * Refactored: Split monolithic sidebar.tsx into smaller, focused components
 */

export * from './SidebarProvider';
export * from './Sidebar';
export * from './SidebarHeader';
export * from './SidebarContent';
export * from './SidebarFooter';
export * from './SidebarGroup';
export * from './SidebarMenu';
export * from './SidebarRail';
export * from './SidebarInput';
export * from './SidebarInset';
export * from './SidebarSeparator';
export * from './SidebarTrigger';
export * from './SidebarThemeToggle';
export * from './types';
export * from './hooks';

// Make sure to re-export the hook for convenience
export { useSidebar } from './hooks';
