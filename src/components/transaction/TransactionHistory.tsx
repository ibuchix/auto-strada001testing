
/**
 * Updated: 2025-08-27
 * Fixed TransactionType comparisons
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionType, TransactionStatus } from "@/services/supabase/transactions/types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TransactionStateIndicator } from "../transaction/TransactionStateIndicator";

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getTypeIcon = (type: string) => {
    // Compare against string values instead of enum
    switch (type) {
      case TransactionType.CREATE:
        return "✏️";
      case TransactionType.UPDATE:
        return "🔄";
      case TransactionType.DELETE:
        return "🗑️";
      case TransactionType.AUCTION:
        return "🔨";
      case "upload":
        return "📤";
      case "payment":
        return "💰";
      case "authentication":
        return "🔐";
      default:
        return "🔄";
    }
  };

  const getStatusColor = (status: string) => {
    // Compare against string values instead of enum
    switch (status) {
      case TransactionStatus.SUCCESS:
        return "bg-green-100 text-green-800";
      case TransactionStatus.ERROR:
        return "bg-red-100 text-red-800";
      case TransactionStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case TransactionStatus.WARNING:
        return "bg-orange-100 text-orange-800";
      case TransactionStatus.INACTIVE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div>Loading transaction history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="success">Success</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <TransactionList transactions={transactions} />
          </TabsContent>
          
          <TabsContent value="errors">
            <TransactionList 
              transactions={transactions.filter(t => t.log_type === 'ERROR')} 
            />
          </TabsContent>
          
          <TabsContent value="success">
            <TransactionList 
              transactions={transactions.filter(t => t.log_type === 'SUCCESS')} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const TransactionList = ({ transactions }: { transactions: any[] }) => {
  if (transactions.length === 0) {
    return <div className="text-center py-4">No transactions found</div>;
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="border rounded-md p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{transaction.message}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant={transaction.log_type === 'ERROR' ? 'destructive' : 'default'}>
              {transaction.log_type}
            </Badge>
          </div>
          
          {transaction.error_message && (
            <div className="mt-2 text-sm text-red-600">
              {transaction.error_message}
            </div>
          )}
          
          {transaction.details && (
            <div className="mt-2 bg-muted p-2 rounded text-xs">
              <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                {JSON.stringify(transaction.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
