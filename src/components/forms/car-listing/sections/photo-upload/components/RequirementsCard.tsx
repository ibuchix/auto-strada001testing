
/**
 * Requirements card component
 * Created: 2025-05-20
 */

import React from 'react';
import { Card } from "@/components/ui/card";

export const RequirementsCard: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="text-sm font-medium mb-2">Upload Requirements</div>
      <ul className="text-sm text-gray-600 space-y-1">
        <li>• At least 3 photos of your vehicle</li>
        <li>• Include exterior front, back, and sides</li>
        <li>• Include interior dashboard and seats</li>
        <li>• Clear, well-lit images</li>
        <li>• Photos should be recent (last 30 days)</li>
      </ul>
    </Card>
  );
};
