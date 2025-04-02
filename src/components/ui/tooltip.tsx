
/**
 * Created: 2028-06-14
 * Simple tooltip component for showing additional information
 */

import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export const Tooltip = ({ children, content }: TooltipProps) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};
