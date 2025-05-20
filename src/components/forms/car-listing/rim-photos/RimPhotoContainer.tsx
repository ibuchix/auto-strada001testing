
/**
 * RimPhotoContainer component
 * Created: 2025-05-20
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RimPhotoContent } from './RimPhotoContent';
import { RimPhotoState, RimPhotoHandlers } from './types';

interface RimPhotoContainerProps {
  state: RimPhotoState;
  handlers: RimPhotoHandlers;
}

export const RimPhotoContainer: React.FC<RimPhotoContainerProps> = ({ 
  state, 
  handlers 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <span>Wheel Rim Photos</span>
        </CardTitle>
        <CardDescription>
          Please upload clear photos of all four wheel rims to document their condition
        </CardDescription>
      </CardHeader>
      <RimPhotoContent state={state} handlers={handlers} />
    </Card>
  );
};
