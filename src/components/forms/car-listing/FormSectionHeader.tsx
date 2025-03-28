
/**
 * Updated FormSectionHeader to include subtitle prop and better spacing
 * Added mobile responsiveness for touch devices
 */
import React, { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface FormSectionHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  right?: ReactNode;
}

export const FormSectionHeader = ({ 
  title, 
  description, 
  subtitle,
  right 
}: FormSectionHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'mb-5 flex flex-col gap-3' : 'mb-6 flex justify-between items-start'}`}>
      <div>
        <h3 className={`${isMobile ? 'text-xl mb-1' : 'text-xl'} font-semibold mb-2`}>{title}</h3>
        {subtitle && (
          <p className="text-gray-600 text-sm mb-1">{subtitle}</p>
        )}
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      {right && (
        <div className={isMobile ? 'self-start mt-2' : ''}>
          {right}
        </div>
      )}
    </div>
  );
};
