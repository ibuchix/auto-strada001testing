
/**
 * Changes made:
 * - 2024-09-10: Created PerformanceMetricsSection component to display seller performance metrics
 */

import { SellerPerformanceMetrics } from "@/hooks/useSellerPerformance";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format, formatDistance } from "date-fns";

interface PerformanceMetricsSectionProps {
  metrics: SellerPerformanceMetrics | null;
  isLoading: boolean;
}

export const PerformanceMetricsSection = ({ 
  metrics, 
  isLoading 
}: PerformanceMetricsSectionProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>View your seller performance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-muted-foreground">Loading performance metrics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>View your seller performance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <p className="text-muted-foreground">No performance data available yet</p>
            <p className="text-sm text-muted-foreground">
              Start listing vehicles to see your performance statistics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const listingStatusData = [
    { name: 'Active', value: metrics.active_listings },
    { name: 'Sold', value: metrics.sold_listings },
    { name: 'Cancelled', value: metrics.cancelled_listings },
  ];

  const successRatePercentage = metrics.total_listings > 0
    ? Math.round((metrics.sold_listings / metrics.total_listings) * 100)
    : 0;

  const reserveMetRatePercentage = metrics.reserve_price_met_rate 
    ? Math.round(metrics.reserve_price_met_rate * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>View your seller performance statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-accent shadow-sm">
              <p className="text-sm text-subtitle">Total Listings</p>
              <p className="text-2xl font-bold text-dark">{metrics.total_listings}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent shadow-sm">
              <p className="text-sm text-subtitle">Sales Success</p>
              <p className="text-2xl font-bold text-dark">{successRatePercentage}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent shadow-sm">
              <p className="text-sm text-subtitle">Total Earnings</p>
              <p className="text-2xl font-bold text-dark">{metrics.total_earnings.toLocaleString()} PLN</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent shadow-sm">
              <p className="text-sm text-subtitle">Avg. Sale Price</p>
              <p className="text-2xl font-bold text-dark">
                {metrics.average_price ? `${Math.round(metrics.average_price).toLocaleString()} PLN` : '-'}
              </p>
            </div>
          </div>

          {/* Chart */}
          {metrics.total_listings > 0 && (
            <div className="h-[200px] w-full">
              <ChartContainer
                config={{
                  active: { color: "#4B4DED" },
                  sold: { color: "#21CA6F" },
                  cancelled: { color: "#DC143C" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={listingStatusData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" />
                    <ChartTooltip>
                      <ChartTooltipContent />
                    </ChartTooltip>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {/* Additional stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-accent">
              <h3 className="font-semibold mb-2">Last Activity</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-subtitle">Last listing:</span>
                  <span>{metrics.last_listing_date 
                    ? formatDistance(new Date(metrics.last_listing_date), new Date(), { addSuffix: true }) 
                    : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtitle">Last sale:</span>
                  <span>{metrics.last_sale_date 
                    ? formatDistance(new Date(metrics.last_sale_date), new Date(), { addSuffix: true }) 
                    : '-'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent">
              <h3 className="font-semibold mb-2">Price Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-subtitle">Highest sale:</span>
                  <span>{metrics.highest_price_sold 
                    ? `${metrics.highest_price_sold.toLocaleString()} PLN` 
                    : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtitle">Reserve price met:</span>
                  <span>{reserveMetRatePercentage > 0 
                    ? `${reserveMetRatePercentage}% of auctions` 
                    : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
