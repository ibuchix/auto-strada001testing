
/**
 * Auction Results Section Component  
 * Updated: 2025-06-12 - Redesigned to focus on bid results and completed auctions
 */

import { formatDistance, format } from 'date-fns';
import { AuctionResult } from '@/hooks/useAuctionResults';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, DollarSign } from "lucide-react";

interface AuctionResultsSectionProps {
  results: AuctionResult[];
  isLoading: boolean;
}

export const AuctionResultsSection = ({ 
  results, 
  isLoading 
}: AuctionResultsSectionProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bids Received & Auction Results</CardTitle>
          <CardDescription>View completed auctions and final bid outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-muted-foreground">Loading auction results...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-dark">Bids Received & Auction Results</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">No completed auctions yet</h3>
            <p className="text-subtitle">
              When your auctions complete, you'll see bid results and final outcomes here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const soldItems = results.filter(r => r.sale_status === 'sold');
  const totalSales = soldItems.reduce((sum, item) => sum + (item.final_price || 0), 0);
  const averageSalePrice = soldItems.length > 0 ? totalSales / soldItems.length : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">Bids Received & Auction Results</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Cars Sold</p>
                <p className="text-2xl font-bold">{soldItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{totalSales.toLocaleString()} PLN</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Sale Price</p>
                <p className="text-2xl font-bold">{averageSalePrice.toLocaleString()} PLN</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Auction History</CardTitle>
          <CardDescription>Detailed results from your completed auctions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Final Outcome</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>Completion Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{result.title || `${result.make} ${result.model} ${result.year}`}</span>
                      <span className="text-xs text-muted-foreground">
                        Reserve: {result.reserve_price?.toLocaleString()} PLN
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={result.sale_status === 'sold' ? "default" : "secondary"}
                      className={result.sale_status === 'sold' ? "bg-green-100 text-green-800" : ""}
                    >
                      {result.sale_status === 'sold' ? 'SOLD' : 
                       result.sale_status === 'unsold' ? 'Reserve Not Met' : 
                       result.sale_status || 'Ended'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {result.final_price ? `${result.final_price.toLocaleString()} PLN` : 'No bids'}
                      </span>
                      {result.final_price && result.reserve_price && (
                        <span className="text-xs text-muted-foreground">
                          {result.final_price >= result.reserve_price ? '✓ Above reserve' : '⚠ Below reserve'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{result.total_bids}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.unique_bidders} bidder{result.unique_bidders !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {result.auction_end_time ? 
                        format(new Date(result.auction_end_time), 'MMM d, yyyy') :
                        format(new Date(result.created_at), 'MMM d, yyyy')
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
