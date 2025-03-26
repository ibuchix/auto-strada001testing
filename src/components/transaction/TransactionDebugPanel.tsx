
/**
 * Changes made:
 * - 2028-07-14: Created TransactionDebugPanel for debugging form submissions
 * - 2028-07-24: Fixed TransactionStateIndicator props
 */

import { useState, useEffect } from "react";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bug, ChevronDown, ChevronUp } from "lucide-react";
import { TransactionStateIndicator } from "./TransactionStateIndicator";

// Only show debug panel in development
const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost';

interface TransactionDebugPanelProps {
  transactionId?: string;
  transactionStatus?: TransactionStatus | null;
  formData?: Record<string, any>;
}

export const TransactionDebugPanel = ({
  transactionId,
  transactionStatus,
  formData
}: TransactionDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Check for debug mode in URL or localStorage
  useEffect(() => {
    const debugParam = new URLSearchParams(window.location.search).get('debug');
    const debugMode = localStorage.getItem('debugMode');
    
    setIsVisible(
      isDevelopment && (debugParam === 'true' || debugMode === 'true')
    );
    
    // Add keyboard shortcut for debug mode toggle (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const newDebugMode = !isVisible;
        setIsVisible(newDebugMode);
        localStorage.setItem('debugMode', newDebugMode.toString());
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <Card className="mt-8 p-4 border-gray-300 border-dashed bg-gray-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full flex items-center justify-between"
          >
            <span className="flex items-center">
              <Bug className="mr-2 h-4 w-4 text-orange-500" />
              Transaction Debug Panel
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Transaction ID:</div>
              <div className="font-mono">{transactionId || 'Not started'}</div>
              
              <div className="font-medium">Status:</div>
              <div>
                {transactionStatus ? (
                  <TransactionStateIndicator 
                    status={transactionStatus}
                    pendingText="In Progress" 
                    successText="Successful" 
                    errorText="Failed"
                  />
                ) : (
                  'No active transaction'
                )}
              </div>
            </div>
            
            <div className="border-t pt-2">
              <div className="font-medium mb-2">Form Data:</div>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(formData || {}, null, 2)}
              </pre>
            </div>
            
            <div className="border-t pt-2">
              <div className="font-medium mb-2">Local Storage:</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('localStorage contents:', Object.entries(localStorage));
                }}
              >
                Log Storage to Console
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
