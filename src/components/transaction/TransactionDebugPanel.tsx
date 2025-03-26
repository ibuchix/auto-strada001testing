
/**
 * Changes made:
 * - 2024-08-04: Updated TransactionStateIndicator props
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Code, RefreshCw } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { TransactionStateIndicator } from "./TransactionStateIndicator";

interface TransactionDebugPanelProps {
  transactionId?: string;
  transactionStatus?: TransactionStatus | null;
  formData?: any;
  onRefresh?: () => void;
}

export const TransactionDebugPanel = ({
  transactionId,
  transactionStatus,
  formData,
  onRefresh
}: TransactionDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only show in development environment
  if (import.meta.env.PROD) {
    return null;
  }
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed bottom-0 right-0 w-full md:w-96 z-50 bg-background/95 backdrop-blur-sm shadow-lg rounded-t-lg border transition-transform"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-between p-2 rounded-none rounded-t-lg text-xs"
        >
          <div className="flex items-center">
            <Code className="h-3.5 w-3.5 mr-2" />
            <span>Transaction Debug</span>
            
            {transactionStatus && (
              <span className="ml-2">
                <TransactionStateIndicator 
                  status={transactionStatus} 
                  pendingText="Pending"
                  successText="Success"
                  errorText="Error"
                />
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex justify-between items-center">
            <span>Transaction Information</span>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-3 text-xs space-y-2">
          <div>
            <span className="font-semibold">Transaction ID:</span> 
            <span className="ml-2 text-muted-foreground">
              {transactionId || 'No active transaction'}
            </span>
          </div>
          
          <div>
            <span className="font-semibold">Status:</span> 
            <span className="ml-2 text-muted-foreground">
              {transactionStatus || 'Not started'}
            </span>
          </div>
          
          {formData && (
            <div>
              <span className="font-semibold">Form Data:</span>
              <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-auto max-h-36">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
};
