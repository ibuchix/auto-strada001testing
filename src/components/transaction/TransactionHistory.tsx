
/**
 * Changes made:
 * - 2024-08-04: Updated imports to use the correct TransactionType from types
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { TransactionType, TransactionStatus, TransactionDetails } from "@/services/supabase/transactions/types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TransactionStatusIndicator } from "./TransactionStatusIndicator";

interface TransactionHistoryProps {
  transactions: TransactionDetails[];
  onClear?: () => void;
  maxHeight?: string;
}

export const TransactionHistory = ({ transactions, onClear, maxHeight = "400px" }: TransactionHistoryProps) => {
  const [selectedType, setSelectedType] = useState<string>("all");
  
  const typeToLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.CREATE:
        return "Create";
      case TransactionType.UPDATE:
        return "Update";
      case TransactionType.DELETE:
        return "Delete";
      case TransactionType.UPLOAD:
        return "Upload";
      case TransactionType.AUCTION:
        return "Auction";
      case TransactionType.PAYMENT:
        return "Payment";
      case TransactionType.AUTHENTICATION:
        return "Auth";
      case TransactionType.OTHER:
        return "Other";
      default:
        return type;
    }
  };

  const filteredTransactions = selectedType === "all" 
    ? transactions 
    : transactions.filter(t => t.type === selectedType);

  const formatDuration = (time: string) => {
    try {
      return formatDistanceToNow(new Date(time), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Recent system transactions and their status
            </CardDescription>
          </div>
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear History
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setSelectedType}>
          <TabList className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-9">
            <Tab value="all">All</Tab>
            <Tab value={TransactionType.CREATE}>Create</Tab>
            <Tab value={TransactionType.UPDATE}>Update</Tab>
            <Tab value={TransactionType.DELETE}>Delete</Tab>
            <Tab value={TransactionType.UPLOAD}>Upload</Tab>
            <Tab value={TransactionType.AUCTION}>Auction</Tab>
            <Tab value={TransactionType.PAYMENT}>Payment</Tab>
            <Tab value={TransactionType.AUTHENTICATION}>Auth</Tab>
            <Tab value={TransactionType.OTHER}>Other</Tab>
          </TabList>
          <TabPanels className="mt-2">
            <TabPanel>
              <div className={`overflow-auto ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.operation}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {typeToLabel(transaction.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <TransactionStatusIndicator status={transaction.status} size="sm" />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDuration(transaction.startTime)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabPanel>
            {/* Duplicate the same table structure for other tabs */}
            <TabPanel>
              {/* Same table for filtered results */}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardContent>
    </Card>
  );
};
