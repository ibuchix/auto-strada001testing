
/**
 * Component for displaying currently uploaded photos
 * - Responsive grid layout
 * - Supports photo removal
 * - Optimized for both desktop and mobile
 * - 2025-04-06: Updated to match app design system
 */
import React from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { CurrentPhotosProps } from './types';

export const CurrentPhotosDisplay = ({ 
  photos, 
  onRemovePhoto 
}: CurrentPhotosProps) => {
  const isMobile = useIsMobile();
  
  if (photos.length === 0) return null;

  // Adjust grid columns based on screen size
  const gridClass = isMobile 
    ? "grid grid-cols-2 gap-3" 
    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";

  return (
    <div className="mt-6 animate-fade-in">
      <h4 className="text-base font-medium mb-3 font-kanit text-body">Current Photos</h4>
      <div className={gridClass}>
        {photos.map((photo, index) => (
          <Card key={index} className="relative overflow-hidden aspect-square border-accent shadow-sm hover:shadow transition-shadow duration-300">
            <img
              src={photo}
              alt={`Car photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {onRemovePhoto && (
              <Button 
                variant="destructive" 
                size="icon" 
                className={`absolute top-1 right-1 ${isMobile ? 'h-8 w-8' : 'h-7 w-7'} rounded-full opacity-70 hover:opacity-100 transition-opacity`}
                onClick={() => onRemovePhoto(photo)}
              >
                <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
