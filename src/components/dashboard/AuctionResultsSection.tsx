
/**
 * Changes made:
 * - 2024-09-08: Created AuctionResultsSection component for the seller dashboard
 * - 2024-09-22: Fixed import for AuctionResult interface
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
          <CardTitle>Auction Results</CardTitle>
          <CardDescription>View the outcomes of your completed auctions</CardDescription>
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
      <Card>
        <CardHeader>
          <CardTitle>Auction Results</CardTitle>
          <CardDescription>View the outcomes of your completed auctions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <p className="text-muted-foreground">No auction results yet</p>
            <p className="text-sm text-muted-foreground">
              When your auctions complete, you'll see their results here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction Results</CardTitle>
        <CardDescription>View the outcomes of your completed auctions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Final Price</TableHead>
              <TableHead>Bids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{result.title || `${result.make} ${result.model} ${result.year}`}</span>
                    <span className="text-xs text-muted-foreground">
                      {result.auction_end_time ? 
                        `Ended ${formatDistance(new Date(result.auction_end_time), new Date(), { addSuffix: true })}` :
                        `Created ${format(new Date(result.created_at), 'MMM d, yyyy')}`
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={result.sale_status === 'sold' ? "success" : "secondary"}
                    className={result.sale_status === 'sold' ? "bg-green-100 text-green-800" : ""}
                  >
                    {result.sale_status === 'sold' ? 'Sold' : result.sale_status || 'Ended'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {result.final_price ? `${result.final_price.toLocaleString()} PLN` : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{result.total_bids} total</span>
                    <span className="text-xs text-muted-foreground">
                      {result.unique_bidders} bidder{result.unique_bidders !== 1 ? 's' : ''}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
