
/**
 * Changes made:
 * - 2028-11-12: Extracted LoadingState component from FormContent.tsx
 */

import { Skeleton } from "@/components/ui/skeleton";

export const LoadingState = () => (
  <div className="space-y-8">
    <Skeleton className="h-12 w-full" />
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full" />
    </div>
    <Skeleton className="h-12 w-1/3 mx-auto" />
  </div>
);
