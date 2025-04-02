
/**
 * Sidebar theme toggle component
 */
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";

export const SidebarThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Toggle
      ref={ref}
      pressed={isDark}
      onPressedChange={toggleTheme}
      data-sidebar="theme-toggle"
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
        className
      )}
      {...props}
    >
      <span className="mr-2">{isDark ? "Dark Mode" : "Light Mode"}</span>
      <div className="rounded-full p-1">
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </div>
    </Toggle>
  );
});

SidebarThemeToggle.displayName = "SidebarThemeToggle";
