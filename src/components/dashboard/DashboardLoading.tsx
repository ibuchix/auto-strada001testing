
/**
 * Changes made:
 * - 2024-09-05: Created DashboardLoading component from SellerDashboard refactoring
 */

import { Skeleton } from "@/components/ui/skeleton";

export const DashboardLoading = () => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Skeleton className="h-40 animate-pulse" />
      <Skeleton className="h-[400px] animate-pulse" />
    </div>
  );
};
